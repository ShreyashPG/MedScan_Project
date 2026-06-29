import { useEffect } from 'react';
import { useParams } from 'react';

const SharedPrescription = () => {
  const { token } = useParams();

  useEffect(() => {
    if (token) {
      // Redirect to the server-rendered HTML endpoint on port 5000
      window.location.href = `http://localhost:5000/shared/${token}`;
    }
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FFFE', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #CCFBF1', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748B' }}>Redirecting to verified prescription page...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default SharedPrescription;
