const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientHistory,
  addPatientRecord,
  updatePatientRecord,
  deletePatientRecord,
} = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(authenticate);
router.use(authorize('doctor'));

router.get('/patients', getPatients);
router.get('/patient/:phone', getPatientHistory);
router.post('/patient/record', addPatientRecord);
router.put('/patient/record/:id', updatePatientRecord);
router.delete('/patient/record/:id', deletePatientRecord);

module.exports = router;
