import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, ShieldAlert, Clock, Eye, Trash2, Loader2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const QRShareModal = ({ prescriptionId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState(72); // default 72h

  useEffect(() => {
    generateLink(72);
  }, [prescriptionId]);

  const generateLink = async (hours) => {
    setLoading(true);
    try {
      const { data } = await api.post('/share/create', {
        prescription_id: prescriptionId,
        expires_in_hours: hours,
      });
      setShareData(data.data);
    } catch (err) {
      toast.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareData?.share_url) return;
    navigator.clipboard.writeText(shareData.share_url);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!shareData?.token) return;
    try {
      await api.delete(`/share/${shareData.token}`);
      toast.success('Share link revoked');
      onClose();
    } catch (err) {
      toast.error('Failed to revoke link');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--primary-100)', color: 'var(--primary)', padding: 8, borderRadius: 'var(--radius-md)' }}>
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Share Prescription</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Generate QR code or link for chemists & doctors</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
          {loading ? (
            <div style={{ padding: '40px 0' }}>
              <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Generating secure QR code...</p>
            </div>
          ) : shareData ? (
            <>
              {/* QR Display */}
              <div style={{
                background: 'var(--white)',
                padding: 20,
                borderRadius: 'var(--radius-xl)',
                border: '2px dashed var(--primary-200)',
                display: 'inline-block',
                margin: '0 auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              }}>
                <QRCodeSVG
                  value={shareData.share_url}
                  size={200}
                  level="H"
                  includeMargin={true}
                />

              </div>

              {/* Share URL Box */}
              <div>
                <label className="form-label" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shareable Web Link</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No login required to view</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    readOnly
                    value={shareData.share_url}
                    className="form-input"
                    style={{ fontSize: '0.8rem', fontFamily: 'monospace', background: 'var(--surface-2)' }}
                  />
                  <button className="btn btn-primary" onClick={handleCopy} style={{ flexShrink: 0 }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Expiry Selector */}
              <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Clock size={16} color="var(--primary)" />
                  <span>Link Expiration:</span>
                </div>
                <select
                  className="form-select"
                  value={expiresIn}
                  onChange={e => {
                    const hrs = parseInt(e.target.value);
                    setExpiresIn(hrs);
                    generateLink(hrs);
                  }}
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '0.82rem' }}
                >
                  <option value={24}>24 Hours</option>
                  <option value={72}>3 Days</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>
            </>
          ) : (
            <p>Error loading share data</p>
          )}
        </div>

        {shareData && !loading && (
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button className="btn btn-danger btn-sm" onClick={handleRevoke}>
              <Trash2 size={14} /> Revoke Access
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRShareModal;
