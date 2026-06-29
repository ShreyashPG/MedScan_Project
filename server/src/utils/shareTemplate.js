/**
 * Generate self-contained, mobile-responsive HTML for shared prescriptions
 */
const renderShareHTML = (data) => {
  const doctorName = data.doctor_name || 'Medical Prescription';
  const patientName = data.patient_name || 'Patient Record';
  const diagnosis = data.diagnosis || null;
  const notes = data.notes || null;
  const createdAt = data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
  const views = data.views || 1;
  const sharedBy = data.shared_by || 'Healthcare Provider';
  const medicines = Array.isArray(data.medicines) ? data.medicines : [];
  const imagePath = data.image_path ? `http://localhost:5000/${data.image_path}` : null;

  const medicinesHTML = medicines.map((med) => {
    const name = typeof med === 'string' ? med : (med.name || 'Medicine');
    const isObj = typeof med === 'object' && med !== null;

    let detailsHTML = '';
    if (isObj) {
      const chips = [];
      if (med.dosage) chips.push(`Dosage: ${med.dosage}`);
      if (med.frequency) chips.push(`Frequency: ${med.frequency}`);
      if (med.duration) chips.push(`Duration: ${med.duration}`);
      if (med.instructions) chips.push(`Instructions: ${med.instructions}`);
      if (chips.length > 0) {
        detailsHTML = `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; font-size:13px; color:#475569;">
          ${chips.map(c => `<span style="background:#F1F5F9; padding:4px 10px; border-radius:6px; font-weight:500;">${c}</span>`).join('')}
        </div>`;
      }
    }

    return `
      <div style="border:1px solid #E2E8F0; border-radius:12px; padding:16px; background:#FFFFFF; margin-bottom:10px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
        <strong style="font-size:17px; color:#0F766E; font-weight:700;">+ ${name}</strong>
        ${detailsHTML}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MedScan Digital Verification - ${doctorName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FFFE; color: #1E293B; padding: 30px 16px; min-height: 100vh; }
    .container { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .card { background: #FFFFFF; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; overflow: hidden; }
    .badge { background: #ECFDF5; color: #059669; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; border: 1px solid #A7F3D0; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="background:#0F766E; color:white; padding:8px 14px; border-radius:12px; font-weight:bold; font-size:18px;">Rx</div>
        <div>
          <h3 style="color:#0F766E; font-size:20px; font-weight:800;">MedScan Verification</h3>
          <p style="font-size:13px; color:#64748B;">Verified Digital Prescription Record</p>
        </div>
      </div>
      <div style="background:#F0FDF4; color:#0F766E; padding:6px 14px; border-radius:50px; font-size:13px; font-weight:600; border:1px solid #CCFBF1;">
        ${views} Views
      </div>
    </div>

    <div class="card">
      <div style="background: linear-gradient(135deg, #F0FDFA, #EFF6FF); padding: 24px; border-bottom: 1px solid #E2E8F0;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <span class="badge">Digital Verification Copy</span>
            <h2 style="color:#0F766E; font-size:22px; font-weight:800; margin-top:6px;">${doctorName}</h2>
          </div>
          <div style="font-size:14px; color:#64748B; font-weight:500;">
            Date: ${createdAt}
          </div>
        </div>
      </div>

      <div style="padding:24px; display:flex; flex-direction:column; gap:20px;">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
          ${patientName ? `<div style="background:#F8FAFC; padding:14px; border-radius:12px; border:1px solid #F1F5F9;">
            <span style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">Patient Name</span>
            <p style="font-weight:700; color:#1E293B; font-size:16px; margin-top:4px;">${patientName}</p>
          </div>` : ''}
          ${diagnosis ? `<div style="background:#F8FAFC; padding:14px; border-radius:12px; border:1px solid #F1F5F9;">
            <span style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">Diagnosis</span>
            <p style="font-weight:700; color:#1E293B; font-size:16px; margin-top:4px;">${diagnosis}</p>
          </div>` : ''}
        </div>

        ${medicines.length > 0 ? `<div>
          <h4 style="margin-bottom:14px; color:#1E293B; font-size:17px; font-weight:700;">Prescribed Medicines (${medicines.length})</h4>
          ${medicinesHTML}
        </div>` : ''}

        ${notes ? `<div style="background:#EFF6FF; color:#1D4ED8; padding:16px; border-radius:12px; border:1px solid #DBEAFE; font-size:14px; line-height:1.5;">
          <strong style="color:#1E40AF;">Notes / Instructions: </strong>${notes}
        </div>` : ''}

        ${imagePath ? `<div>
          <h4 style="margin-bottom:12px; color:#1E293B; font-size:17px; font-weight:700;">Original Scanned Document</h4>
          <div style="background:#F8FAFC; border-radius:12px; padding:12px; border:1px solid #E2E8F0; text-align:center;">
            <img src="${imagePath}" alt="Prescription" style="max-width:100%; max-height:450px; object-fit:contain; border-radius:8px;" onerror="this.style.display='none'">
          </div>
        </div>` : ''}
      </div>

      <div style="text-align:center; font-size:13px; color:#64748B; padding:16px 24px; background:#F8FAFC; border-top:1px solid #E2E8F0; font-weight:500;">
        Shared securely by <strong style="color:#1E293B;">${sharedBy}</strong> via MedScan Healthcare Platform
      </div>
    </div>
  </div>
</body>
</html>`;
};

const renderErrorHTML = (message) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MedScan - Prescription Unavailable</title>
  <style>
    body { font-family: system-ui, sans-serif; background-color: #F8FFFE; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { max-width: 440px; width: 100%; text-align: center; padding: 32px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="card">
    <div style="background:#FEF2F2; color:#DC2626; width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:24px; font-weight:bold;">!</div>
    <h3 style="margin-bottom:10px; color:#1E293B; font-size:20px; font-weight:700;">Prescription Unavailable</h3>
    <p style="color:#475569; font-size:14px; line-height:1.5; margin-bottom:24px;">${message}</p>
    <div style="font-size:13px; color:#94A3B8; font-weight:500;">Powered by MedScan AI</div>
  </div>
</body>
</html>`;
};

module.exports = { renderShareHTML, renderErrorHTML };
