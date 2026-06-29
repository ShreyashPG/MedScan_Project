const { pool } = require('../config/db');
const { chatWithHealthAssistant } = require('../services/groq.service');

/**
 * POST /api/chat/message
 * Send a message to the AI Health Assistant with patient history context
 */
const sendMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Fetch patient's recent prescription context if logged in as patient
    let patientContext = [];
    if (req.user && req.user.role === 'patient') {
      const result = await pool.query(
        `SELECT p.doctor_name, p.diagnosis, p.medicines_json, sh.created_at
         FROM scan_history sh
         JOIN prescriptions p ON sh.prescription_id = p.id
         WHERE sh.patient_id = $1
         ORDER BY sh.created_at DESC
         LIMIT 5`,
        [req.user.id]
      );
      patientContext = result.rows;
    } else if (req.user && req.user.role === 'doctor') {
      // If doctor is using it, fetch their recent patient records as general context
      const result = await pool.query(
        `SELECT patient_name, diagnosis, notes
         FROM patient_records
         WHERE doctor_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [req.user.id]
      );
      patientContext = result.rows;
    }

    const fullMessages = [...history, { role: 'user', content: message }];
    const aiResponse = await chatWithHealthAssistant(fullMessages, patientContext);

    return res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
    });
  }
};

/**
 * GET /api/chat/suggestions
 * Get personalized quick-prompt suggestions based on user role
 */
const getChatSuggestions = async (req, res) => {
  try {
    let suggestions = [
      'What should I do if I miss a dose of my medicine?',
      'How do I store antibiotics properly?',
      'What are common signs of drug allergic reactions?',
      'Should I take my medicines before or after food?'
    ];

    if (req.user && req.user.role === 'patient') {
      const result = await pool.query(
        `SELECT p.medicines_json
         FROM scan_history sh
         JOIN prescriptions p ON sh.prescription_id = p.id
         WHERE sh.patient_id = $1
         ORDER BY sh.created_at DESC
         LIMIT 1`,
        [req.user.id]
      );
      if (result.rows.length > 0) {
        const meds = typeof result.rows[0].medicines_json === 'string'
          ? JSON.parse(result.rows[0].medicines_json)
          : result.rows[0].medicines_json;
        if (meds && meds.length > 0 && meds[0].name) {
          suggestions.unshift(`What are common side effects of ${meds[0].name}?`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: suggestions.slice(0, 4),
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: ['What are common side effects of my medicines?'],
    });
  }
};

module.exports = { sendMessage, getChatSuggestions };
