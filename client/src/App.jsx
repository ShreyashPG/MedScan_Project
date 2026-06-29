import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';

// Patient pages
import ScanHistory from './pages/patient/ScanHistory';
import Profile from './pages/patient/Profile';

// Doctor pages
import PatientLookup from './pages/doctor/PatientLookup';
import PatientHistory from './pages/doctor/PatientHistory';

// Chemist pages
import Inventory from './pages/chemist/Inventory';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            },
            success: {
              iconTheme: { primary: '#14B8A6', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#DC2626', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected — All roles */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<ScanPage />} />

            {/* Patient routes */}
            <Route
              path="/patient/history"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <ScanHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Doctor routes */}
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <PatientLookup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patient/:phone"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <PatientHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/profile"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Chemist routes */}
            <Route
              path="/chemist/inventory"
              element={
                <ProtectedRoute allowedRoles={['chemist']}>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chemist/profile"
              element={
                <ProtectedRoute allowedRoles={['chemist']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
