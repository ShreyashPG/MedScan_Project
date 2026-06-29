const express = require('express');
const router = express.Router();
const { getHistory, addToHistory, deleteHistory, getDoctors } = require('../controllers/patient.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(authenticate);
router.use(authorize('patient'));

router.get('/history', getHistory);
router.post('/history', addToHistory);
router.delete('/history/:id', deleteHistory);
router.get('/doctors', getDoctors);

module.exports = router;
