const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getSamples,
  getSampleById,
  scanSamplePrescription,
} = require('../controllers/samples.controller');

// All sample routes require authentication
router.use(authenticate);

router.get('/', getSamples);
router.get('/:id', getSampleById);
router.post('/:id/scan', scanSamplePrescription);

module.exports = router;
