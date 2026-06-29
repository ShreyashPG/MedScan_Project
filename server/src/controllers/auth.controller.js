const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { signToken } = require('../utils/jwt');

/**
 * POST /api/auth/register
 * Register a new user (patient, doctor, or chemist)
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, phone, password, role',
      });
    }

    // Validate role
    const validRoles = ['patient', 'doctor', 'chemist'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be one of: patient, doctor, chemist',
      });
    }

    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Check if phone already exists
    const phoneCheck = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered.',
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, created_at`,
      [name.trim(), email.toLowerCase(), phone, passwordHash, role]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
    });
  }
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, name, email, phone, password_hash, role, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * PUT /api/auth/profile
 * Update user profile (name, phone)
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;

    if (!name && !phone) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or phone) is required',
      });
    }

    // Check phone uniqueness if updating phone
    if (phone) {
      const phoneCheck = await pool.query(
        'SELECT id FROM users WHERE phone = $1 AND id != $2',
        [phone, userId]
      );
      if (phoneCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already in use',
        });
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, phone, role, created_at`,
      [name || null, phone || null, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = { register, login, getMe, updateProfile };
