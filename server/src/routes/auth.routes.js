const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
