# MedScan — Healthcare Prescription Scanner

A full-stack healthcare application with AI-powered prescription scanning using **Groq Vision API**.

## Tech Stack
- **Frontend**: React + Vite, React Router, Axios, React Hot Toast, Lucide Icons
- **Backend**: Express.js, PostgreSQL, JWT Authentication
- **AI**: Groq Vision API (`meta-llama/llama-4-scout-17b-16e-instruct`)
- **PDF**: PDFKit

## User Roles
| Role | Features |
|------|----------|
| 🧑‍⚕️ **Patient** | Scan prescriptions, view history filtered by doctor, download PDF |
| 👨‍⚕️ **Doctor** | Scan prescriptions, manage patient records by phone, track history, PDF reports |
| 💊 **Chemist** | Scan prescriptions, check inventory availability, find alternatives, manage stock |

## Setup

### 1. PostgreSQL
Create a database named `medscan`:
```sql
CREATE DATABASE medscan;
```

### 2. Backend Setup
```bash
cd server
# Edit .env with your settings
cp .env.example .env   # Then fill in GROQ_API_KEY and DB credentials

npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

## Environment Variables (server/.env)
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medscan
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

GROQ_API_KEY=your_groq_api_key   # Get from console.groq.com
```

## API Endpoints
- `POST /api/auth/register` — Register (patient/doctor/chemist)
- `POST /api/auth/login` — Login
- `POST /api/scan/prescription` — Scan prescription image with Groq
- `POST /api/scan/medicine-info` — Get medicine details with Groq
- `GET /api/patient/history` — Patient scan history
- `GET /api/doctor/patients` — Doctor's patient list
- `GET /api/chemist/inventory` — Chemist inventory
- `POST /api/chemist/check-availability` — Check medicine availability
- `GET /api/pdf/*` — PDF generation endpoints

## Notes
- Images must be < 4MB (Groq API limit)
- All API requests require `Authorization: Bearer <token>` header (except auth endpoints)
- The schema is auto-created on first server startup
