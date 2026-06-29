const express = require('express');
const router = express.Router();
const { getPatientAnalytics, getDoctorAnalytics, getChemistAnalytics } = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(authenticate);

router.get('/patient', authorize('patient'), getPatientAnalytics);
router.get('/doctor', authorize('doctor'), getDoctorAnalytics);
router.get('/chemist', authorize('chemist'), getChemistAnalytics);

module.exports = router;
