const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { renderShareHTML, renderErrorHTML } = require('../utils/shareTemplate');

/**
 * POST /api/share/create
 * Create a share link and QR code for a prescription
 */
const createShareLink = async (req, res) => {
  try {
    const { prescription_id, expires_in_hours = 72 } = req.body;

    if (!prescription_id) {
      return res.status(400).json({ success: false, message: 'prescription_id is required' });
    }

    // Verify prescription exists
    const presResult = await pool.query('SELECT id FROM prescriptions WHERE id = $1', [prescription_id]);
    if (presResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const clientHost = req.headers.origin || 'http://localhost:5173';
    const expiresAt = expires_in_hours ? new Date(Date.now() + expires_in_hours * 3600 * 1000) : null;

    // Check if an active token already exists for this prescription and user
    const existingResult = await pool.query(
      `SELECT token, expires_at FROM share_tokens 
       WHERE prescription_id = $1 AND created_by = $2 AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC LIMIT 1`,
      [prescription_id, req.user.id]
    );

    let token;
    if (existingResult.rows.length > 0) {
      token = existingResult.rows[0].token;
      // Update expiration date if requested
      await pool.query('UPDATE share_tokens SET expires_at = $1 WHERE token = $2', [expiresAt, token]);
    } else {
      token = uuidv4().replace(/-/g, '');
      await pool.query(
        `INSERT INTO share_tokens (token, prescription_id, created_by, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [token, prescription_id, req.user.id, expiresAt]
      );
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const serverHost = req.headers.host || 'localhost:5000';
    const shareUrl = `${protocol}://${serverHost}/shared/${token}`;
    const qrCodeBase64 = await QRCode.toDataURL(shareUrl);

    return res.status(200).json({
      success: true,
      data: {
        token,
        share_url: shareUrl,
        qr_code: qrCodeBase64,
        expires_at: expiresAt,
      },
    });

  } catch (error) {
    console.error('Create share link error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create share link' });
  }
};

/**
 * GET /api/share/:token or GET /shared/:token
 * Public endpoint to view a shared prescription by token
 * Responds with dynamic HTML or JSON based on request headers
 */
const viewSharedPrescription = async (req, res) => {
  const acceptsJSON = req.headers.accept && req.headers.accept.includes('application/json');

  try {
    const { token } = req.params;

    const tokenResult = await pool.query(
      `SELECT st.*, p.*, u.name as creator_name
       FROM share_tokens st
       JOIN prescriptions p ON st.prescription_id = p.id
       JOIN users u ON st.created_by = u.id
       WHERE st.token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      const msg = 'Share link not found or invalid';
      if (acceptsJSON) return res.status(404).json({ success: false, message: msg });
      return res.status(404).type('html').send(renderErrorHTML(msg));
    }

    const share = tokenResult.rows[0];

    if (!share.is_active) {
      const msg = 'This share link has been revoked';
      if (acceptsJSON) return res.status(410).json({ success: false, message: msg });
      return res.status(410).type('html').send(renderErrorHTML(msg));
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      const msg = 'This share link has expired';
      if (acceptsJSON) return res.status(410).json({ success: false, message: msg });
      return res.status(410).type('html').send(renderErrorHTML(msg));
    }

    // Increment view count
    await pool.query('UPDATE share_tokens SET view_count = view_count + 1 WHERE id = $1', [share.id]);

    const medicines = typeof share.medicines_json === 'string'
      ? JSON.parse(share.medicines_json)
      : share.medicines_json;

    const responseData = {
      prescription_id: share.prescription_id,
      doctor_name: share.doctor_name,
      patient_name: share.patient_name,
      diagnosis: share.diagnosis,
      notes: share.notes,
      medicines,
      image_path: share.image_path,
      created_at: share.created_at,
      shared_by: share.creator_name,
      views: share.view_count + 1,
    };

    if (acceptsJSON) {
      return res.status(200).json({ success: true, data: responseData });
    }

    return res.status(200).type('html').send(renderShareHTML(responseData));
  } catch (error) {
    console.error('View shared prescription error:', error);
    const msg = 'Failed to retrieve shared prescription';
    if (acceptsJSON) return res.status(500).json({ success: false, message: msg });
    return res.status(500).type('html').send(renderErrorHTML(msg));
  }
};

/**
 * GET /api/share/my-shares
 */
const getMyShares = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.*, p.doctor_name, p.patient_name
       FROM share_tokens st
       JOIN prescriptions p ON st.prescription_id = p.id
       WHERE st.created_by = $1
       ORDER BY st.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get my shares error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch shares' });
  }
};

/**
 * DELETE /api/share/:token
 */
const revokeShare = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pool.query(
      'UPDATE share_tokens SET is_active = FALSE WHERE token = $1 AND created_by = $2 RETURNING id',
      [token, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Share link not found or access denied' });
    }

    return res.status(200).json({ success: true, message: 'Share link revoked successfully' });
  } catch (error) {
    console.error('Revoke share error:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke share link' });
  }
};

module.exports = { createShareLink, viewSharedPrescription, getMyShares, revokeShare };
