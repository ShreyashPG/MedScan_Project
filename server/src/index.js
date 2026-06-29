const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { testConnection, initializeDB } = require('./config/db');

// Routes
const authRoutes = require('./routes/auth.routes');
const scanRoutes = require('./routes/scan.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const chemistRoutes = require('./routes/chemist.routes');
const pdfRoutes = require('./routes/pdf.routes');
const samplesRoutes = require('./routes/samples.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
}));

// Large JSON limit for base64 image uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded images
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MedScan API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/chemist', chemistRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/samples', samplesRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start server
const startServer = async () => {
  try {
    await testConnection();
    await initializeDB();

    app.listen(PORT, () => {
      console.log(`\n🚀 MedScan Server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔑 Make sure GROQ_API_KEY is set in .env\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
