-- MedScan Database Schema
-- Run this to set up all required tables

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (all roles share this table)
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    phone         VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(10) CHECK (role IN ('patient', 'doctor', 'chemist')) NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- Prescriptions (scanned prescriptions - raw OCR + structured data)
CREATE TABLE IF NOT EXISTS prescriptions (
    id               SERIAL PRIMARY KEY,
    scanned_by       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    image_path       VARCHAR(500),
    extracted_text   TEXT NOT NULL,
    medicines_json   JSONB DEFAULT '[]',
    doctor_name      VARCHAR(200),
    patient_name     VARCHAR(200),
    patient_phone    VARCHAR(20),
    diagnosis        TEXT,
    notes            TEXT,
    scan_role        VARCHAR(10) CHECK (scan_role IN ('patient', 'doctor', 'chemist')),
    created_at       TIMESTAMP DEFAULT NOW()
);

-- Patient scan history (patient's own scan records)
CREATE TABLE IF NOT EXISTS scan_history (
    id               SERIAL PRIMARY KEY,
    patient_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prescription_id  INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE,
    doctor_name      VARCHAR(200),
    created_at       TIMESTAMP DEFAULT NOW()
);

-- Doctor's patient records (track per patient by phone)
CREATE TABLE IF NOT EXISTS patient_records (
    id               SERIAL PRIMARY KEY,
    doctor_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
    patient_phone    VARCHAR(20) NOT NULL,
    patient_name     VARCHAR(200),
    prescription_id  INTEGER REFERENCES prescriptions(id) ON DELETE SET NULL,
    diagnosis        TEXT,
    notes            TEXT,
    visit_date       DATE DEFAULT CURRENT_DATE,
    created_at       TIMESTAMP DEFAULT NOW()
);

-- Chemist inventory
CREATE TABLE IF NOT EXISTS inventory (
    id               SERIAL PRIMARY KEY,
    chemist_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    medicine_name    VARCHAR(300) NOT NULL,
    generic_name     VARCHAR(300),
    ingredients      TEXT,
    category         VARCHAR(100),
    quantity         INTEGER DEFAULT 0,
    unit             VARCHAR(50) DEFAULT 'tablets',
    price            DECIMAL(10,2) DEFAULT 0.00,
    expiry_date      DATE,
    manufacturer     VARCHAR(200),
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    UNIQUE(chemist_id, medicine_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_scanned_by ON prescriptions(scanned_by);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_phone ON prescriptions(patient_phone);
CREATE INDEX IF NOT EXISTS idx_scan_history_patient_id ON scan_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_doctor_name ON scan_history(doctor_name);
CREATE INDEX IF NOT EXISTS idx_patient_records_doctor_id ON patient_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_records_patient_phone ON patient_records(patient_phone);
CREATE INDEX IF NOT EXISTS idx_inventory_chemist_id ON inventory(chemist_id);
