import React from 'react';

const apps = [
  { name: 'Classroom', icon: 'bi-easel2-fill', color: '#1e8e3e' },
  { name: 'Google Drive', icon: 'bi-google', color: '#1a73e8' },
  { name: 'Google Meet', icon: 'bi-camera-video-fill', color: '#00897b' },
  { name: 'Google Docs', icon: 'bi-file-earmark-word-fill', color: '#4285f4' },
  { name: 'Google Sheets', icon: 'bi-file-earmark-spreadsheet-fill', color: '#0f9d58' },
  { name: 'Google Slides', icon: 'bi-file-earmark-slides-fill', color: '#f4b400' },
  { name: 'Calendar', icon: 'bi-calendar-date-fill', color: '#1a73e8' },
  { name: 'Gmail', icon: 'bi-envelope-fill', color: '#ea4335' },
  { name: 'YouTube', icon: 'bi-youtube', color: '#ff0000' }
];

const AppsDropdown = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div
      className="position-absolute bg-white shadow-lg border rounded p-3"
      style={{
        top: '56px',
        right: '16px',
        width: '310px',
        zIndex: 1060,
        maxHeight: '440px',
        overflowY: 'auto'
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <span className="fw-bold small text-muted text-uppercase">Google Apps</span>
        <button className="btn-close btn-sm" onClick={onClose}></button>
      </div>
      <div className="row g-2 text-center">
        {apps.map((app, idx) => (
          <div key={idx} className="col-4">
            <div
              className="p-2 rounded d-flex flex-direction-column flex-column align-items-center justify-content-center"
              style={{ cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => {
                window.open('https://workspace.google.com', '_blank');
                onClose();
              }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-1 shadow-sm"
                style={{ width: '48px', height: '48px', backgroundColor: '#f8f9fa', fontSize: '1.5rem', color: app.color }}
              >
                <i className={`bi ${app.icon}`}></i>
              </div>
              <span className="text-truncate d-block w-100 text-dark" style={{ fontSize: '0.78rem' }}>
                {app.name}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-top mt-3 pt-2 text-center">
        <a
          href="https://workspace.google.com/marketplace"
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-link text-decoration-none fw-medium"
        >
          More from Google Workspace
        </a>
      </div>
    </div>
  );
};

export default AppsDropdown;
