const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'medscan',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database schema on startup
const initializeDB = async () => {
  try {
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
};

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
};

module.exports = { pool, initializeDB, testConnection };
