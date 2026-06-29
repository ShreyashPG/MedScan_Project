const { pool } = require('../config/db');

/**
 * GET /api/patient/history
 * Get patient's scan history, optionally filtered by doctor name
 */
const getHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctor } = req.query;

    let query = `
      SELECT 
        sh.id,
        sh.doctor_name,
        sh.created_at,
        p.id as prescription_id,
        p.patient_name,
        p.diagnosis,
        p.medicines_json,
        p.extracted_text,
        p.image_path,
        p.notes
      FROM scan_history sh
      JOIN prescriptions p ON sh.prescription_id = p.id
      WHERE sh.patient_id = $1
    `;
    const params = [patientId];

    if (doctor) {
      query += ` AND LOWER(sh.doctor_name) LIKE LOWER($2)`;
      params.push(`%${doctor}%`);
    }

    query += ` ORDER BY sh.created_at DESC`;

    const result = await pool.query(query, params);

    const history = result.rows.map((row) => ({
      ...row,
      medicines_json: typeof row.medicines_json === 'string'
        ? JSON.parse(row.medicines_json)
        : row.medicines_json || [],
    }));

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
    });
  }
};

/**
 * POST /api/patient/history
 * Save a scan to patient's history
 */
const addToHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { prescription_id, doctor_name } = req.body;

    if (!prescription_id) {
      return res.status(400).json({
        success: false,
        message: 'prescription_id is required',
      });
    }

    // Verify prescription belongs to this user
    const prescCheck = await pool.query(
      'SELECT id, doctor_name FROM prescriptions WHERE id = $1 AND scanned_by = $2',
      [prescription_id, patientId]
    );

    if (prescCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found or access denied',
      });
    }

    const resolvedDoctorName = doctor_name || prescCheck.rows[0].doctor_name;

    // Check for duplicate
    const dupCheck = await pool.query(
      'SELECT id FROM scan_history WHERE patient_id = $1 AND prescription_id = $2',
      [patientId, prescription_id]
    );

    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This prescription is already in your history',
      });
    }

    const result = await pool.query(
      `INSERT INTO scan_history (patient_id, prescription_id, doctor_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [patientId, prescription_id, resolvedDoctorName]
    );

    return res.status(201).json({
      success: true,
      message: 'Saved to history successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Add to history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save to history',
    });
  }
};

/**
 * DELETE /api/patient/history/:id
 * Delete a scan from patient history
 */
const deleteHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM scan_history WHERE id = $1 AND patient_id = $2 RETURNING id',
      [id, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'History record not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'History record deleted successfully',
    });
  } catch (error) {
    console.error('Delete history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete history record',
    });
  }
};

/**
 * GET /api/patient/doctors
 * Get unique doctor names from patient's history
 */
const getDoctors = async (req, res) => {
  try {
    const patientId = req.user.id;

    const result = await pool.query(
      `SELECT DISTINCT doctor_name FROM scan_history 
       WHERE patient_id = $1 AND doctor_name IS NOT NULL
       ORDER BY doctor_name`,
      [patientId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows.map((r) => r.doctor_name),
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
    });
  }
};

module.exports = { getHistory, addToHistory, deleteHistory, getDoctors };
