import React from 'react';
import ClassCard from './ClassCard.jsx';

const ClassesPage = ({
  classes,
  user,
  onSelectClass,
  onArchiveClass,
  onUnenrollClass,
  onOpenCreateModal,
  onOpenJoinModal,
  onOpenClasswork
}) => {
  const activeClasses = classes.filter(c => !c.isArchived);
  const teachingClasses = activeClasses.filter(c => c.isTeaching);
  const enrolledClasses = activeClasses.filter(c => !c.isTeaching);

  if (activeClasses.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 mt-5">
        <div
          className="rounded-circle bg-white shadow p-4 mb-4 d-flex align-items-center justify-content-center"
          style={{ width: '120px', height: '120px' }}
        >
          <i className="bi bi-easel2 text-primary" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="font-google fw-bold text-dark mb-2">Welcome to Google Classroom</h4>
        <p className="text-muted max-w-md mx-auto mb-4" style={{ maxWidth: '420px' }}>
          Classroom helps classes communicate, save time, and stay organized. Get started by joining or creating your first class.
        </p>
        <div className="d-flex gap-3">
          <button
            className="btn btn-outline-primary px-4 py-2 fw-medium rounded-pill"
            onClick={onOpenJoinModal}
          >
            Join a class
          </button>
          {user.role === 'teacher' && (
            <button
              className="btn text-white px-4 py-2 fw-medium rounded-pill shadow-sm"
              style={{ backgroundColor: '#1a73e8' }}
              onClick={onOpenCreateModal}
            >
              Create a class
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      {/* Teaching Section */}
      {teachingClasses.length > 0 && (
        <div className="mb-5">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <h5 className="font-google fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-person-workspace text-primary"></i>
              Teaching ({teachingClasses.length})
            </h5>
            <button
              className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium"
              onClick={onOpenCreateModal}
            >
              <i className="bi bi-plus-lg me-1"></i> Create class
            </button>
          </div>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 row-cols-xxl-4 g-4">
            {teachingClasses.map(cls => (
              <div key={cls.id} className="col">
                <ClassCard
                  cls={cls}
                  user={user}
                  onSelectClass={onSelectClass}
                  onArchiveClass={onArchiveClass}
                  onUnenrollClass={onUnenrollClass}
                  onOpenClasswork={onOpenClasswork}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Section */}
      {enrolledClasses.length > 0 && (
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <h5 className="font-google fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-backpack text-success"></i>
              Enrolled ({enrolledClasses.length})
            </h5>
            <button
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-medium"
              onClick={onOpenJoinModal}
            >
              <i className="bi bi-plus-lg me-1"></i> Join class
            </button>
          </div>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 row-cols-xxl-4 g-4">
            {enrolledClasses.map(cls => (
              <div key={cls.id} className="col">
                <ClassCard
                  cls={cls}
                  user={user}
                  onSelectClass={onSelectClass}
                  onArchiveClass={onArchiveClass}
                  onUnenrollClass={onUnenrollClass}
                  onOpenClasswork={onOpenClasswork}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
