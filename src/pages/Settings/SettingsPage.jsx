import React, { useState } from 'react';
import Avatar from '../../components/Common/Avatar.jsx';

const SettingsPage = ({ user, classes, onUpdateUser, onToggleRole }) => {
  const [name, setName] = useState(user?.name || '');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [commentNotifs, setCommentNotifs] = useState(true);
  const [privateNotifs, setPrivateNotifs] = useState(true);
  const [lateNotifs, setLateNotifs] = useState(true);
  const [classNotifs, setClassNotifs] = useState(() => {
    const obj = {};
    (classes || []).forEach(c => {
      if (c && c.id != null) obj[c.id] = true;
    });
    return obj;
  });

  const currentRole = typeof user?.role === 'string' ? user.role : user?.role?.role_name || 'student';

  const getDisplayName = (person) => {
    if (!person) return 'User';
    const fullName = [person.first_name || person.firstName, person.last_name || person.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return fullName || person.fullName || person.name || 'User';
  };

  const displayName = getDisplayName(user);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdateUser({ ...user, name: name.trim() });
    alert("Profile saved!");
  };

  const colors = ['#1a73e8', '#1e8e3e', '#00897b', '#8e24aa', '#e65100', '#ea4335', '#37474f'];

  return (
    <div className="max-w-3xl mx-auto py-3 px-2 px-md-4" style={{ maxWidth: '780px' }}>
      <h3 className="font-google fw-bold text-dark mb-4 border-bottom pb-3">Settings</h3>

      {/* Profile Section */}
      <div className="card border shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-header bg-light border-bottom p-4">
          <h5 className="font-google fw-bold mb-0">Profile</h5>
        </div>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-4 mb-4 flex-wrap">
            <Avatar name={user} size={72} color={user.color} className="shadow" />
            <div>
              <h6 className="fw-semibold text-dark mb-1">Avatar Accent Color</h6>
              <div className="d-flex gap-2 flex-wrap mt-2">
                {colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn rounded-circle p-0 border shadow-sm d-flex align-items-center justify-content-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: c,
                      border: user.color === c ? '3px solid #212529' : '1px solid #ddd'
                    }}
                    onClick={() => onUpdateUser({ ...user, color: c })}
                  >
                    {user.color === c && <i className="bi bi-check text-white small"></i>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="profileName"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <label htmlFor="profileName">Full Name</label>
            </div>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                id="profileEmail"
                placeholder="Email address"
                value={user.email}
                disabled
              />
              <label htmlFor="profileEmail">Email address (Managed by Google)</label>
            </div>
            
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm rounded-pill px-3"
                onClick={onToggleRole}
              >
                Switch Role (Currently: <strong>{currentRole}</strong>)
              </button>
              <button type="submit" className="btn btn-primary px-4 fw-medium">
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="card border shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-header bg-light border-bottom p-4">
          <h5 className="font-google fw-bold mb-0">Notifications</h5>
        </div>
        <div className="card-body p-4">
          <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0 mb-3 border-bottom pb-3">
            <div>
              <label className="form-check-label fw-bold text-dark d-block mb-1" htmlFor="emailNotifSwitch">
                Email
              </label>
              <span className="text-muted small">Receive email notifications for important class events</span>
            </div>
            <input
              className="form-check-input ms-0 fs-4"
              type="checkbox"
              role="switch"
              id="emailNotifSwitch"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
            />
          </div>

          <h6 className="fw-bold text-muted small text-uppercase mb-3 mt-4">Comments</h6>
          
          <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0 mb-3">
            <label className="form-check-label text-dark small" htmlFor="commentOnPost">Comments on your posts</label>
            <input className="form-check-input ms-0 fs-5" type="checkbox" role="switch" id="commentOnPost" checked={commentNotifs} onChange={(e) => setCommentNotifs(e.target.checked)} />
          </div>

          <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0 mb-3">
            <label className="form-check-label text-dark small" htmlFor="privateComment">Private comments on coursework</label>
            <input className="form-check-input ms-0 fs-5" type="checkbox" role="switch" id="privateComment" checked={privateNotifs} onChange={(e) => setPrivateNotifs(e.target.checked)} />
          </div>

          <h6 className="fw-bold text-muted small text-uppercase mb-3 mt-4">Classes you teach</h6>
          <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0 mb-3">
            <label className="form-check-label text-dark small" htmlFor="lateSub">Late submissions of student work</label>
            <input className="form-check-input ms-0 fs-5" type="checkbox" role="switch" id="lateSub" checked={lateNotifs} onChange={(e) => setLateNotifs(e.target.checked)} />
          </div>
        </div>
      </div>

      {/* Class Notifications Toggle list */}
      <div className="card border shadow-sm rounded-4 bg-white mb-5">
        <div className="card-header bg-light border-bottom p-4">
          <h5 className="font-google fw-bold mb-0">Class notifications</h5>
        </div>
        <div className="card-body p-4">
          <p className="text-muted small mb-4">Turn mobile and email notifications on or off for individual classes.</p>
          {(classes || []).filter(c => c && !c.isArchived).map((cls) => {
            const className = cls.name || 'Class';
            return (
              <div key={cls.id} className="form-check form-switch d-flex justify-content-between align-items-center ps-0 mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                    style={{ width: '28px', height: '28px', backgroundColor: cls.themeColor || '#1a73e8', fontSize: '12px' }}
                  >
                    {className[0]}
                  </div>
                  <span className="fw-medium text-dark small">{className}</span>
                </div>
                <input
                  className="form-check-input ms-0 fs-5"
                  type="checkbox"
                  role="switch"
                  checked={classNotifs[cls.id] ?? true}
                  onChange={(e) => setClassNotifs({ ...classNotifs, [cls.id]: e.target.checked })}
                />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;
