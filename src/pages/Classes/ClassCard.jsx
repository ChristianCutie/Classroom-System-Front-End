import React, { useState } from 'react';
import Avatar from '../../components/Common/Avatar.jsx';

const ClassCard = ({
  cls,
  user,
  onSelectClass,
  onArchiveClass,
  onUnenrollClass,
  onOpenClasswork
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const truncateText = (text, maxLength = 25) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const upcomingWork = [
    ...(Array.isArray(cls.assignments) ? cls.assignments.map(item => ({ ...item, type: 'Assignment' })) : []),
    ...(Array.isArray(cls.quizzes) ? cls.quizzes.map(item => ({ ...item, type: 'Quiz' })) : [])
  ]
    .filter(item => item.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 2);

  const getDisplayName = (person) => {
    if (!person) return 'Teacher';
    const fullName = [person.first_name || person.firstName, person.last_name || person.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return fullName || person.fullName || person.name || 'Teacher';
  };

  const fullName = getDisplayName(cls.teacher);

  return (
    <div className="gc-class-card position-relative d-flex flex-column h-100 shadow-sm">
      
      {/* Top Banner Header */}
      <div
        className="gc-class-banner position-relative"
        style={{ background: cls.banner }}
      >
        <div className="d-flex justify-content-between align-items-start">
          <div
            className="text-white text-decoration-none pe-3 flex-grow-1"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectClass(cls.id)}
          >
            <h5 className="font-google fw-bold mb-1" style={{ fontSize: '1.25rem' }}>
              {truncateText(cls.subject, 25)}
            </h5>
            <div className="small text-white text-opacity-90 text-truncate fw-medium" style={{ fontSize: '0.85rem' }}>
              {cls.section}
              {cls.class_code && (
                <span className="d-block text-white text-opacity-75" style={{ fontSize: '0.75rem' }}>
                 Class Code: {cls.class_code}
                </span>
              )}
            </div>
          </div>

          <div className="position-relative z-3">
            <button
              className="btn btn-link text-white p-1 text-decoration-none d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              aria-label="Class options"
            >
              <i className="bi bi-three-dots-vertical"></i>
            </button>

            {showMenu && (
              <div
                className="dropdown-menu show position-absolute bg-white shadow-lg border py-2"
                style={{ right: 0, top: '36px', minWidth: '180px', zIndex: 1050 }}
              >
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() => {
                    setShowMenu(false);
                    navigator.clipboard?.writeText(`https://classroom.google.com/c/${cls.class_code}`);
                    alert(`Invite link copied for ${cls.subject}`);
                  }}
                >
                  <i className="bi bi-link-45deg text-secondary fs-5"></i>
                  Copy invite link
                </button>

                {cls.isTeaching ? (
                  <>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2"
                      onClick={() => {
                        setShowMenu(false);
                        alert(`Edit options for ${cls.subject}`);
                      }}
                    >
                      <i className="bi bi-pencil text-secondary"></i>
                      Edit
                    </button>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 text-danger"
                      onClick={() => {
                        setShowMenu(false);
                        onArchiveClass(cls.id);
                      }}
                    >
                      <i className="bi bi-archive text-danger"></i>
                      Archive
                    </button>
                  </>
                ) : (
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                    onClick={() => {
                      setShowMenu(false);
                      onUnenrollClass(cls.id);
                    }}
                  >
                    <i className="bi bi-box-arrow-right text-danger"></i>
                    Unenroll
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="small text-white text-opacity-75 text-truncate" style={{ fontSize: '0.8rem' }}>
          {fullName}
        </div>
      </div>

      {/* Teacher Avatar overlapping banner */}
      <div className="position-absolute" style={{ top: '68px', right: '16px', zIndex: 2 }}>
        <Avatar
          name={cls.teacher}
          size={64}
          color={cls.themeColor || "#1a73e8"}
          className="border border-white border-3 shadow"
        />
      </div>

      {/* Middle Body: Assignment list */}
      <div
        className="p-3 flex-grow-1 d-flex flex-column justify-content-between pt-4 mt-2"
        style={{ cursor: 'pointer', minHeight: '130px' }}
        onClick={() => onSelectClass(cls.id)}
      >
        <div>
          {upcomingWork.length > 0 ? (
            upcomingWork.map(item => (
              <div key={`${item.type}-${item.id}`} className="mb-2">
                <div className="text-muted small fw-medium text-truncate" style={{ fontSize: '0.78rem' }}>
                  Due {formatDueDate(item.due_date)}
                </div>
                <div className="text-dark small text-truncate fw-semibold" style={{ fontSize: '0.87rem' }}>
                  {item.title}
                </div>
                <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>
                  {item.type}
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted small py-3">No work due soon</div>
          )}
        </div>
      </div>

      {/* Card Footer: Folder & Gradebook/Open icons */}
      <div className="border-top px-3 py-2 d-flex justify-content-end align-items-center bg-white gap-1">
        <button
          className="btn-icon btn-icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenClasswork(cls.id);
          }}
          title="Open your work for this class"
        >
          <i className="bi bi-person-badge fs-5"></i>
        </button>
        <button
          className="btn-icon btn-icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            window.open('https://drive.google.com', '_blank');
          }}
          title="Open folder for this class in Google Drive"
        >
          <i className="bi bi-folder2-open fs-5"></i>
        </button>
      </div>

    </div>
  );
};

export default ClassCard;
