import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({
  isOpen,
  classes = [],
  user,
  onNavigatePage,
  onSelectClass
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Filter active (non-archived) classes
  const activeClasses = classes.filter(c => !c.is_archived);
  // Teaching classes: user is the teacher
  const teachingClasses = activeClasses.filter(c => c.teacher_id === user?.id);
  // Enrolled classes: user is not the teacher
  const enrolledClasses = activeClasses.filter(c => c.teacher_id !== user?.id);

  // Determine if user is a teacher (using the nested role object)
  const isTeacher = user?.role?.role_name === 'teacher';

  // Helper to check if a route is active
  const isActive = (path) => {
    if (path === 'home') return location.pathname === '/';
    return location.pathname === `/${path}`;
  };

  const isClassActive = (classId) => {
    return location.pathname === `/class/${classId}`;
  };

  return (
    <div className={`gc-sidebar pt-2 ${!isOpen ? 'closed' : ''}`}>
      {/* Top navigation */}
      <div className="d-flex flex-column mb-4 pb-3 border-bottom">
        <div
          className={`gc-sidebar-item ${isActive('home') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <i className="bi bi-house-door-fill"></i>
          <span>Classes</span>
        </div>
        <div
          className={`gc-sidebar-item ${isActive('calendar') ? 'active' : ''}`}
          onClick={() => navigate('/calendar')}
        >
          <i className="bi bi-calendar-date"></i>
          <span>Calendar</span>
        </div>
      </div>

      {/* Teaching section – only for teachers */}
      {isTeacher && (
        <div className="mb-4 pb-3 border-bottom">
          <div className="px-4 mb-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
            Teaching
          </div>
          <div
            className={`gc-sidebar-item ${isActive('todo') ? 'active' : ''}`}
            onClick={() => navigate('/todo')}
          >
            <i className="bi bi-clipboard-check"></i>
            <span>To review</span>
          </div>

          {teachingClasses.map((cls) => (
            <div
              key={cls.id}
              className={`gc-sidebar-item ${isClassActive(cls.id) ? 'active' : ''}`}
              onClick={() => onSelectClass(cls.id)}
            >
              <div
                className="rounded-circle me-3 flex-shrink-0 d-flex align-items-center justify-content-center text-white fw-bold small"
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: cls.theme_color || '#1a73e8',
                  fontSize: '12px'
                }}
              >
                {cls.class_name ? cls.class_name.charAt(0) : '?'}
              </div>
              <span className="text-truncate">{cls.class_name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Enrolled section – visible to everyone */}
      <div className="mb-4 pb-3 border-bottom">
        <div className="px-4 mb-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
          Enrolled
        </div>
        <div
          className={`gc-sidebar-item ${isActive('todo') ? 'active' : ''}`}
          onClick={() => navigate('/todo')}
        >
          <i className="bi bi-list-check"></i>
          <span>To-do</span>
        </div>

        {enrolledClasses.map((cls) => (
          <div
            key={cls.id}
            className={`gc-sidebar-item ${isClassActive(cls.id) ? 'active' : ''}`}
            onClick={() => onSelectClass(cls.id)}
          >
            <div
              className="rounded-circle me-3 flex-shrink-0 d-flex align-items-center justify-content-center text-white fw-bold small"
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: cls.theme_color || '#00897b',
                fontSize: '12px'
              }}
            >
              {cls.class_name ? cls.class_name.charAt(0) : '?'}
            </div>
            <span className="text-truncate">{cls.class_name}</span>
          </div>
        ))}
        {enrolledClasses.length === 0 && (
          <div className="px-4 text-muted small fst-italic py-1">No enrolled classes yet</div>
        )}
      </div>

      {/* Footer links */}
      <div className="mb-4">
        <div
          className={`gc-sidebar-item ${isActive('archived') ? 'active' : ''}`}
          onClick={() => navigate('/archived')}
        >
          <i className="bi bi-archive"></i>
          <span>Archived classes</span>
        </div>
        <div
          className={`gc-sidebar-item ${isActive('settings') ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          <i className="bi bi-gear"></i>
          <span>Settings</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;