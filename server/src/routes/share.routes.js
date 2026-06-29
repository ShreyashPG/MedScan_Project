const express = require('express');
const router = express.Router();
const { createShareLink, viewSharedPrescription, getMyShares, revokeShare } = require('../controllers/share.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.post('/create', authenticate, createShareLink);
router.get('/user/my-shares', authenticate, getMyShares);
router.delete('/:token', authenticate, revokeShare);

// Public route to view prescription via QR token (placed last to prevent collision)
router.get('/:token', viewSharedPrescription);

module.exports = router;

