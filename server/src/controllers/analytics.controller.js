const { pool } = require('../config/db');

/**
 * GET /api/analytics/patient
 * Patient analytics dashboard data
 */
const getPatientAnalytics = async (req, res) => {
  try {
    const patientId = req.user.id;

    // 1. Scans per month
    const monthlyScansResult = await pool.query(
      `SELECT TO_CHAR(created_at, 'Mon YYYY') as month, COUNT(*) as count, MIN(created_at) as sort_date
       FROM scan_history
       WHERE patient_id = $1
       GROUP BY month
       ORDER BY sort_date ASC
       LIMIT 6`,
      [patientId]
    );

    // 2. Top doctors visited
    const topDoctorsResult = await pool.query(
      `SELECT doctor_name, COUNT(*) as visits
       FROM scan_history
       WHERE patient_id = $1 AND doctor_name IS NOT NULL AND doctor_name != ''
       GROUP BY doctor_name
       ORDER BY visits DESC
       LIMIT 5`,
      [patientId]
    );

    // 3. Most prescribed medicines breakdown
    const medicinesResult = await pool.query(
      `SELECT p.medicines_json
       FROM scan_history sh
       JOIN prescriptions p ON sh.prescription_id = p.id
       WHERE sh.patient_id = $1`,
      [patientId]
    );

    const medCounts = {};
    medicinesResult.rows.forEach(r => {
      const meds = typeof r.medicines_json === 'string' ? JSON.parse(r.medicines_json) : r.medicines_json;
      if (Array.isArray(meds)) {
        meds.forEach(m => {
          if (m.name) {
            const cleanName = m.name.trim();
            medCounts[cleanName] = (medCounts[cleanName] || 0) + 1;
          }
        });
      }
    });

    const topMedicines = Object.keys(medCounts)
      .map(name => ({ name, count: medCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return res.status(200).json({
      success: true,
      data: {
        monthlyScans: monthlyScansResult.rows,
        topDoctors: topDoctorsResult.rows,
        topMedicines,
      },
    });
  } catch (error) {
    console.error('Patient analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch patient analytics' });
  }
};

/**
 * GET /api/analytics/doctor
 * Doctor analytics dashboard data
 */
const getDoctorAnalytics = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // 1. Visits per month
    const monthlyVisitsResult = await pool.query(
      `SELECT TO_CHAR(visit_date, 'Mon YYYY') as month, COUNT(*) as visits, MIN(visit_date) as sort_date
       FROM patient_records
       WHERE doctor_id = $1
       GROUP BY month
       ORDER BY sort_date ASC
       LIMIT 6`,
      [doctorId]
    );

    // 2. Top Diagnoses
    const topDiagnosesResult = await pool.query(
      `SELECT diagnosis, COUNT(*) as count
       FROM patient_records
       WHERE doctor_id = $1 AND diagnosis IS NOT NULL AND diagnosis != ''
       GROUP BY diagnosis
       ORDER BY count DESC
       LIMIT 5`,
      [doctorId]
    );

    // 3. Stats summary
    const statsResult = await pool.query(
      `SELECT 
         COUNT(DISTINCT patient_phone) as total_patients,
         COUNT(*) as total_visits
       FROM patient_records
       WHERE doctor_id = $1`,
      [doctorId]
    );

    const totalPatients = parseInt(statsResult.rows[0].total_patients || 0);
    const totalVisits = parseInt(statsResult.rows[0].total_visits || 0);
    const avgVisits = totalPatients > 0 ? (totalVisits / totalPatients).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      data: {
        monthlyVisits: monthlyVisitsResult.rows,
        topDiagnoses: topDiagnosesResult.rows,
        summary: { totalPatients, totalVisits, avgVisits },
      },
    });
  } catch (error) {
    console.error('Doctor analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor analytics' });
  }
};

/**
 * GET /api/analytics/chemist
 * Chemist inventory analytics dashboard data
 */
const getChemistAnalytics = async (req, res) => {
  try {
    const chemistId = req.user.id;

    // 1. Inventory by Category
    const categoryResult = await pool.query(
      `SELECT COALESCE(category, 'General') as category, COUNT(*) as count, SUM(quantity) as total_quantity
       FROM inventory
       WHERE chemist_id = $1
       GROUP BY COALESCE(category, 'General')`,
      [chemistId]
    );

    // 2. Low Stock Items (< 10 units)
    const lowStockResult = await pool.query(
      `SELECT medicine_name, quantity, price
       FROM inventory
       WHERE chemist_id = $1 AND quantity < 10
       ORDER BY quantity ASC
       LIMIT 8`,
      [chemistId]
    );

    // 3. Expiring Soon (Next 30 Days)
    const expiringResult = await pool.query(
      `SELECT medicine_name, expiry_date, quantity
       FROM inventory
       WHERE chemist_id = $1 AND expiry_date IS NOT NULL AND expiry_date <= NOW() + INTERVAL '30 days'
       ORDER BY expiry_date ASC
       LIMIT 5`,
      [chemistId]
    );

    // 4. Total Valuation
    const valuationResult = await pool.query(
      `SELECT SUM(quantity * price) as total_valuation, COUNT(*) as total_items
       FROM inventory
       WHERE chemist_id = $1`,
      [chemistId]
    );

    return res.status(200).json({
      success: true,
      data: {
        categoryBreakdown: categoryResult.rows,
        lowStock: lowStockResult.rows,
        expiringSoon: expiringResult.rows,
        summary: {
          totalValuation: parseFloat(valuationResult.rows[0].total_valuation || 0).toFixed(2),
          totalItems: parseInt(valuationResult.rows[0].total_items || 0),
        },
      },
    });
  } catch (error) {
    console.error('Chemist analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chemist analytics' });
  }
};

module.exports = { getPatientAnalytics, getDoctorAnalytics, getChemistAnalytics };
