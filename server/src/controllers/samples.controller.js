const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { extractPrescription } = require('../services/groq.service');

const SAMPLES_DIR = path.join(__dirname, '../../uploads/samples');
const INDEX_FILE = path.join(SAMPLES_DIR, 'index.json');

/**
 * Helper: Read the index.json file
 */
const readIndex = () => {
  if (!fs.existsSync(INDEX_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {
    return null;
  }
};

/**
 * GET /api/samples
 * List all available sample prescriptions from the dataset
 */
const getSamples = (req, res) => {
  const { page = 1, limit = 12, search = '' } = req.query;

  // Check if samples directory exists
  if (!fs.existsSync(SAMPLES_DIR)) {
    return res.status(200).json({
      success: true,
      available: false,
      message: 'Sample dataset not downloaded yet. Run: python download_dataset.py',
      data: [],
      total: 0,
    });
  }

  const index = readIndex();

  if (!index) {
    // Fall back to scanning directory directly
    try {
      const files = fs.readdirSync(SAMPLES_DIR)
        .filter(f => f.endsWith('.png'))
        .sort();

      const samples = files.map((filename, idx) => {
        const base = path.basename(filename, '.png');
        const jsonFile = path.join(SAMPLES_DIR, `${base}.json`);
        let meta = {};
        if (fs.existsSync(jsonFile)) {
          try { meta = JSON.parse(fs.readFileSync(jsonFile, 'utf8')); } catch {}
        }
        return {
          id: idx,
          filename,
          image_url: `/uploads/samples/${filename}`,
          ground_truth: meta.ground_truth || {},
          raw_ground_truth: meta.raw_ground_truth || '',
        };
      });

      const filtered = search
        ? samples.filter(s => JSON.stringify(s.ground_truth).toLowerCase().includes(search.toLowerCase()))
        : samples;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.status(200).json({
        success: true,
        available: true,
        total: filtered.length,
        page: pageNum,
        limit: limitNum,
        data: paginated,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to read samples directory' });
    }
  }

  // Use index file
  let samples = index.samples || [];

  if (search) {
    samples = samples.filter(s =>
      JSON.stringify(s.ground_truth).toLowerCase().includes(search.toLowerCase()) ||
      (s.raw_ground_truth || '').toLowerCase().includes(search.toLowerCase())
    );
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const paginated = samples.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.status(200).json({
    success: true,
    available: true,
    total: samples.length,
    page: pageNum,
    limit: limitNum,
    source: index.source,
    split: index.split,
    data: paginated.map(s => ({
      ...s,
      image_url: `/uploads/samples/${s.filename}`,
    })),
  });
};

/**
 * GET /api/samples/:id
 * Get a specific sample by ID
 */
const getSampleById = (req, res) => {
  const { id } = req.params;
  const index = readIndex();

  if (!index) {
    // Try direct file access
    const filename = `prescription_${String(id).padStart(4, '0')}.png`;
    const imgPath = path.join(SAMPLES_DIR, filename);
    if (!fs.existsSync(imgPath)) {
      return res.status(404).json({ success: false, message: 'Sample not found' });
    }
    return res.status(200).json({
      success: true,
      data: {
        id: parseInt(id),
        filename,
        image_url: `/uploads/samples/${filename}`,
      },
    });
  }

  const sample = index.samples.find(s => s.id === parseInt(id));
  if (!sample) {
    return res.status(404).json({ success: false, message: 'Sample not found' });
  }

  return res.status(200).json({
    success: true,
    data: { ...sample, image_url: `/uploads/samples/${sample.filename}` },
  });
};

/**
 * POST /api/samples/:id/scan
 * Scan a sample prescription using Groq Vision API
 * Converts the stored image to base64 and sends to Groq
 */
const scanSamplePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the image file
    const index = readIndex();
    let filename;

    if (index) {
      const sample = index.samples.find(s => s.id === parseInt(id));
      if (!sample) {
        return res.status(404).json({ success: false, message: 'Sample not found' });
      }
      filename = sample.filename;
    } else {
      filename = `prescription_${String(id).padStart(4, '0')}.png`;
    }

    const imgPath = path.join(SAMPLES_DIR, filename);
    if (!fs.existsSync(imgPath)) {
      return res.status(404).json({ success: false, message: `Image file not found: ${filename}` });
    }

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imgPath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/png';

    // Validate size (Groq limit: 4MB base64)
    if (imageBuffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Sample image too large for Groq API (max 4MB)',
      });
    }

    // Extract with Groq Vision
    const extractedData = await extractPrescription(base64Image, mimeType);

    // Save to prescriptions table
    const imagePath = `uploads/samples/${filename}`;
    const result = await pool.query(
      `INSERT INTO prescriptions 
       (scanned_by, image_path, extracted_text, medicines_json, doctor_name, patient_name, patient_phone, diagnosis, notes, scan_role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, created_at`,
      [
        req.user.id,
        imagePath,
        extractedData.raw_text || JSON.stringify(extractedData),
        JSON.stringify(extractedData.medicines || []),
        extractedData.doctor_name || null,
        extractedData.patient_name || null,
        null,
        extractedData.diagnosis || null,
        extractedData.instructions || null,
        req.user.role,
      ]
    );

    const prescription = result.rows[0];

    // Also get ground truth for comparison (if available)
    let groundTruth = null;
    if (index) {
      const sample = index.samples.find(s => s.id === parseInt(id));
      groundTruth = sample?.ground_truth || null;
    } else {
      const jsonFile = path.join(SAMPLES_DIR, filename.replace('.png', '.json'));
      if (fs.existsSync(jsonFile)) {
        try {
          const meta = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
          groundTruth = meta.ground_truth || null;
        } catch {}
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Sample prescription scanned successfully',
      data: {
        prescription_id: prescription.id,
        ...extractedData,
        image_path: imagePath,
        image_url: `/uploads/samples/${filename}`,
        ground_truth: groundTruth,
        created_at: prescription.created_at,
        is_sample: true,
      },
    });
  } catch (error) {
    console.error('Scan sample error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to scan sample prescription',
    });
  }
};

module.exports = { getSamples, getSampleById, scanSamplePrescription };
