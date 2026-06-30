import React, { useState } from 'react';
import StreamTab from './StreamTab.jsx';
import ClassworkTab from './ClassworkTab.jsx';
import PeopleTab from './PeopleTab.jsx';
import GradesTab from './GradesTab.jsx';
import { bannerGradients } from '../../data/mockData.jsx';

const ClassDetailPage = ({
  cls,
  user,
  onPostAnnouncement,
  onAddComment,
  onCreateCoursework,
  onSubmitCoursework,
  onUpdateGrade,
  onUpdateClassBanner
}) => {
  const [activeTab, setActiveTab] = useState('stream');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  if (!cls) return null;

  return (
    <div className="container-fluid px-2 px-md-4 py-2">
      
      {/* Navigation Tabs Header */}
      <div className="border-bottom bg-white mb-3 mt-n3 mx-n2 mx-md-n4 px-2 px-md-4 d-flex justify-content-between align-items-center flex-wrap">
        <ul className="nav gc-nav-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'stream' ? 'active' : ''}`}
              onClick={() => setActiveTab('stream')}
            >
              Stream
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'classwork' ? 'active' : ''}`}
              onClick={() => setActiveTab('classwork')}
            >
              Classwork
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'people' ? 'active' : ''}`}
              onClick={() => setActiveTab('people')}
            >
              People
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'grades' ? 'active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              Grades
            </button>
          </li>
        </ul>

        <div className="d-flex align-items-center gap-2 py-2">
          <button
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-2"
            onClick={() => setShowCustomizeModal(true)}
          >
            <i className="bi bi-palette text-primary"></i>
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Main Banner */}
      <div
        className="gc-detail-banner mb-4"
        style={{ background: cls.banner }}
      >
        <div className="d-flex justify-content-between align-items-end w-100">
          <div>
            <h1 className="font-google fw-bold mb-1 text-white" style={{ fontSize: '2.2rem', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
              {cls.subject}
            </h1>
            <p className="mb-0 text-white text-opacity-90 fs-5">
              {cls.section || cls.subject}
            </p>
          </div>
          <div className="d-none d-md-block text-end">
            <span className="badge bg-white text-dark py-2 px-3 fw-medium font-monospace shadow-sm">
              Class Code: {cls.class_code}
            </span>
          </div>
        </div>
      </div>

      {/* Active Tab Component */}
      <div>
        {activeTab === 'stream' && (
          <StreamTab
            cls={cls}
            user={user}
            onPostAnnouncement={onPostAnnouncement}
            onAddComment={onAddComment}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'classwork' && (
          <ClassworkTab
            cls={cls}
            user={user}
            onCreateCoursework={onCreateCoursework}
            onSubmitCoursework={onSubmitCoursework}
          />
        )}
        {activeTab === 'people' && (
          <PeopleTab
            cls={cls}
            user={user}
          />
        )}
        {activeTab === 'grades' && (
          <GradesTab
            cls={cls}
            user={user}
            onUpdateGrade={onUpdateGrade}
          />
        )}
      </div>

      {/* Customize Theme Modal */}
      {showCustomizeModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">Customize appearance</h5>
                <button className="btn-close" onClick={() => setShowCustomizeModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-3">Select Banner Theme</label>
                <div className="row g-3">
                  {bannerGradients.map((b) => (
                    <div key={b.id} className="col-6">
                      <div
                        className="p-3 rounded-3 text-white fw-bold d-flex align-items-center justify-content-between shadow-sm"
                        style={{
                          background: b.css,
                          cursor: 'pointer',
                          height: '70px',
                          border: cls.banner === b.css ? '3px solid #000' : 'none'
                        }}
                        onClick={() => {
                          onUpdateClassBanner(cls.id, b.css, b.color);
                          setShowCustomizeModal(false);
                        }}
                      >
                        <span className="small">{b.name}</span>
                        {cls.banner === b.css && <i className="bi bi-check-circle-fill text-white fs-5"></i>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClassDetailPage;
