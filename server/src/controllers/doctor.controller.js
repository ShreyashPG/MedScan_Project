const { pool } = require('../config/db');

/**
 * GET /api/doctor/patients
 * Get all unique patients (by phone) for this doctor
 */
const getPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const result = await pool.query(
      `SELECT 
        patient_phone,
        patient_name,
        COUNT(*) as visit_count,
        MAX(created_at) as last_visit
       FROM patient_records
       WHERE doctor_id = $1
       GROUP BY patient_phone, patient_name
       ORDER BY last_visit DESC`,
      [doctorId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
    });
  }
};

/**
 * GET /api/doctor/patient/:phone
 * Get full history for a patient by phone number
 */
const getPatientHistory = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { phone } = req.params;

    const result = await pool.query(
      `SELECT 
        pr.id,
        pr.patient_phone,
        pr.patient_name,
        pr.diagnosis,
        pr.notes,
        pr.visit_date,
        pr.created_at,
        p.id as prescription_id,
        p.medicines_json,
        p.extracted_text,
        p.image_path,
        p.doctor_name as prescribing_doctor
       FROM patient_records pr
       LEFT JOIN prescriptions p ON pr.prescription_id = p.id
       WHERE pr.doctor_id = $1 AND pr.patient_phone = $2
       ORDER BY pr.visit_date DESC, pr.created_at DESC`,
      [doctorId, phone]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        patient_phone: phone,
      });
    }

    const records = result.rows.map((row) => ({
      ...row,
      medicines_json: typeof row.medicines_json === 'string'
        ? JSON.parse(row.medicines_json)
        : row.medicines_json || [],
    }));

    return res.status(200).json({
      success: true,
      count: records.length,
      patient_name: records[0]?.patient_name || null,
      patient_phone: phone,
      data: records,
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient history',
    });
  }
};

/**
 * POST /api/doctor/patient/record
 * Add a new prescription/record for a patient
 */
const addPatientRecord = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const {
      patient_phone,
      patient_name,
      prescription_id,
      diagnosis,
      notes,
      visit_date,
    } = req.body;

    if (!patient_phone) {
      return res.status(400).json({
        success: false,
        message: 'patient_phone is required',
      });
    }

    // If prescription_id provided, verify it exists and belongs to this doctor
    if (prescription_id) {
      const prescCheck = await pool.query(
        'SELECT id FROM prescriptions WHERE id = $1 AND scanned_by = $2',
        [prescription_id, doctorId]
      );
      if (prescCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found or access denied',
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO patient_records 
       (doctor_id, patient_phone, patient_name, prescription_id, diagnosis, notes, visit_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        doctorId,
        patient_phone,
        patient_name || null,
        prescription_id || null,
        diagnosis || null,
        notes || null,
        visit_date || new Date().toISOString().split('T')[0],
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Patient record added successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Add patient record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add patient record',
    });
  }
};

/**
 * PUT /api/doctor/patient/record/:id
 * Update a patient record
 */
const updatePatientRecord = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    const { diagnosis, notes, visit_date, patient_name } = req.body;

    const result = await pool.query(
      `UPDATE patient_records
       SET diagnosis = COALESCE($1, diagnosis),
           notes = COALESCE($2, notes),
           visit_date = COALESCE($3, visit_date),
           patient_name = COALESCE($4, patient_name)
       WHERE id = $5 AND doctor_id = $6
       RETURNING *`,
      [diagnosis, notes, visit_date, patient_name, id, doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Record not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update patient record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update record',
    });
  }
};

/**
 * DELETE /api/doctor/patient/record/:id
 * Delete a patient record
 */
const deletePatientRecord = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM patient_records WHERE id = $1 AND doctor_id = $2 RETURNING id',
      [id, doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Record not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error) {
    console.error('Delete patient record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete record',
    });
  }
};

module.exports = {
  getPatients,
  getPatientHistory,
  addPatientRecord,
  updatePatientRecord,
  deletePatientRecord,
};
