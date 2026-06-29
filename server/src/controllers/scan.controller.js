const { pool } = require('../config/db');
const { extractPrescription, getMedicineInfo } = require('../services/groq.service');
const path = require('path');
const fs = require('fs');

/**
 * POST /api/scan/prescription
 * Scan a prescription image using Groq Vision API
 * Accepts base64 encoded image in request body
 */
const scanPrescription = async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg' } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required (base64 encoded)',
      });
    }

    // Validate image size (Groq limit: 4MB base64)
    const imageSizeBytes = Buffer.byteLength(image, 'base64');
    if (imageSizeBytes > 4 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image too large. Maximum size is 4MB.',
      });
    }

    // Extract prescription using Groq Vision
    const extractedData = await extractPrescription(image, mimeType);

    // Save image to disk
    let imagePath = null;
    try {
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `prescription_${req.user.id}_${Date.now()}.jpg`;
      imagePath = path.join(uploadDir, filename);
      fs.writeFileSync(imagePath, Buffer.from(image, 'base64'));
      imagePath = `uploads/${filename}`;
    } catch (imgError) {
      console.error('Image save error:', imgError.message);
      // Continue even if image save fails
    }

    // Save prescription to database
    const result = await pool.query(
      `INSERT INTO prescriptions 
       (scanned_by, image_path, extracted_text, medicines_json, doctor_name, patient_name, patient_phone, diagnosis, notes, scan_role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        imagePath,
        extractedData.raw_text || JSON.stringify(extractedData),
        JSON.stringify(extractedData.medicines || []),
        extractedData.doctor_name || null,
        extractedData.patient_name || null,
        null, // patient_phone set later when saving to history
        extractedData.diagnosis || null,
        extractedData.instructions || null,
        req.user.role,
      ]
    );

    const prescription = result.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Prescription scanned successfully',
      data: {
        prescription_id: prescription.id,
        ...extractedData,
        image_path: imagePath,
        created_at: prescription.created_at,
      },
    });
  } catch (error) {
    console.error('Scan prescription error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to scan prescription',
    });
  }
};

/**
 * POST /api/scan/medicine-info
 * Get detailed information about a medicine using Groq
 */
const getMedicineDetails = async (req, res) => {
  try {
    const { medicine_name } = req.body;

    if (!medicine_name) {
      return res.status(400).json({
        success: false,
        message: 'medicine_name is required',
      });
    }

    const info = await getMedicineInfo(medicine_name);

    return res.status(200).json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error('Medicine info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine information',
    });
  }
};

/**
 * GET /api/scan/:id
 * Get a specific scan by ID
 */
const getScanById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, u.name as scanned_by_name, u.role as scanned_by_role
       FROM prescriptions p
       JOIN users u ON p.scanned_by = u.id
       WHERE p.id = $1 AND p.scanned_by = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found',
      });
    }

    const scan = result.rows[0];
    return res.status(200).json({
      success: true,
      data: {
        ...scan,
        medicines_json: typeof scan.medicines_json === 'string'
          ? JSON.parse(scan.medicines_json)
          : scan.medicines_json,
      },
    });
  } catch (error) {
    console.error('Get scan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch scan',
    });
  }
};

module.exports = { scanPrescription, getMedicineDetails, getScanById };
