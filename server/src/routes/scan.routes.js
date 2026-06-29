const express = require('express');
const router = express.Router();
const { scanPrescription, getMedicineDetails, checkInteractions, getScanById } = require('../controllers/scan.controller');
const { authenticate } = require('../middleware/auth');

// All scan routes require authentication
router.use(authenticate);

router.post('/prescription', scanPrescription);
router.post('/medicine-info', getMedicineDetails);
router.post('/check-interactions', checkInteractions);
router.get('/:id', getScanById);

module.exports = router;

