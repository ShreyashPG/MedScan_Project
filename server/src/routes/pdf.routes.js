const express = require('express');
const router = express.Router();
const {
  generatePatientHistoryPDF,
  generateDoctorPatientPDF,
  generateInventoryPDF,
  generateClinicalSummaryPDF,
} = require('../controllers/pdf.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(authenticate);

router.get('/patient-history', authorize('patient'), generatePatientHistoryPDF);
router.get('/doctor-patient/:phone', authorize('doctor'), generateDoctorPatientPDF);
router.get('/clinical-summary/:phone', authorize('doctor'), generateClinicalSummaryPDF);
router.get('/chemist-inventory', authorize('chemist'), generateInventoryPDF);

module.exports = router;

