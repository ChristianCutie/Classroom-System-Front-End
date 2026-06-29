import React from 'react';
import ClassCard from '../Classes/ClassCard.jsx';

const ArchivedPage = ({ classes, user, onRestoreClass, onDeleteClass }) => {
  const archivedClasses = classes.filter(c => c.isArchived);

  if (archivedClasses.length === 0) {
    return (
      <div className="text-center py-5 mt-5">
        <div
          className="rounded-circle bg-white shadow p-4 mb-4 d-flex align-items-center justify-content-center mx-auto"
          style={{ width: '100px', height: '100px' }}
        >
          <i className="bi bi-archive text-secondary" style={{ fontSize: '3rem' }}></i>
        </div>
        <h4 className="font-google fw-bold text-dark mb-2">No archived classes</h4>
        <p className="text-muted small max-w-sm mx-auto" style={{ maxWidth: '380px' }}>
          Classes you archive will appear here. You can restore them anytime or delete them forever.
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      <div className="mb-4 border-bottom pb-3">
        <h4 className="font-google fw-bold text-dark mb-1 d-flex align-items-center gap-2">
          <i className="bi bi-archive-fill text-secondary"></i>
          Archived classes ({archivedClasses.length})
        </h4>
        <p className="text-muted small mb-0">Archived classes are frozen. Teachers and students can view coursework but cannot post new items.</p>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 row-cols-xxl-4 g-4">
        {archivedClasses.map(cls => (
          <div key={cls.id} className="col">
            <div className="card h-100 border shadow-sm rounded-3 overflow-hidden position-relative opacity-75">
              <div
                className="gc-class-banner"
                style={{ background: cls.banner, filter: 'grayscale(30%)' }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="font-google fw-bold mb-1">{cls.name}</h5>
                    <div className="small text-white text-opacity-90">{cls.section || cls.subject}</div>
                  </div>
                  <span className="badge bg-dark bg-opacity-50 border small">Archived</span>
                </div>
              </div>

              <div className="card-body p-4 d-flex flex-column justify-content-between bg-white">
                <p className="text-muted small mb-4">
                  Instructor: <strong>{cls.teacher?.name}</strong>
                </p>
                <div className="d-flex justify-content-end gap-2 border-top pt-3">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      if (window.confirm(`Delete "${cls.name}" forever? This cannot be undone.`)) {
                        onDeleteClass(cls.id);
                      }
                    }}
                  >
                    Delete forever
                  </button>
                  <button
                    className="btn btn-sm btn-primary fw-medium"
                    onClick={() => onRestoreClass(cls.id)}
                  >
                    Restore
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArchivedPage;
