import React, { useState } from 'react';
import Avatar from '../../components/Common/Avatar.jsx';

const PeopleTab = ({ cls, user }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const students = cls.students || [];
  const allSelected = students.length > 0 && selectedStudents.length === students.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const toggleStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sId => sId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    alert(`Invitation sent to ${inviteEmail.trim()}`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto" style={{ maxWidth: '850px' }}>
      
      {/* Teachers Section */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <h4 className="font-google fw-bold mb-0" style={{ color: cls.themeColor || '#1a73e8' }}>
            Teachers
          </h4>
          {user.role === 'teacher' && (
            <button
              className="btn btn-icon text-primary"
              title="Invite teachers"
              onClick={() => setShowInviteModal(true)}
            >
              <i className="bi bi-person-plus-fill fs-4"></i>
            </button>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-between py-2 px-3 hover-bg-light rounded">
          <div className="d-flex align-items-center gap-3">
            <Avatar name={cls.teacher?.name || "Teacher"} size={44} color={cls.themeColor || '#1a73e8'} />
            <span className="fw-medium text-dark">{cls.teacher?.name || "Dr. Eleanor Vance"}</span>
          </div>
          <a
            href={`mailto:${cls.teacher?.email || 'teacher@university.edu'}`}
            className="btn btn-icon text-secondary"
            title="Email teacher"
          >
            <i className="bi bi-envelope fs-5"></i>
          </a>
        </div>
      </div>

      {/* Students Section */}
      <div>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-3">
            <h4 className="font-google fw-bold mb-0" style={{ color: cls.themeColor || '#1a73e8' }}>
              Students
            </h4>
            <span className="badge bg-light text-muted border">{students.length} {students.length === 1 ? 'student' : 'students'}</span>
          </div>

          {user.role === 'teacher' && (
            <button
              className="btn btn-icon text-primary"
              title="Invite students"
              onClick={() => setShowInviteModal(true)}
            >
              <i className="bi bi-person-plus-fill fs-4"></i>
            </button>
          )}
        </div>

        {/* Bulk action toolbar when checkboxes are checked */}
        {user.role === 'teacher' && students.length > 0 && (
          <div className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-3 border">
            <div className="form-check ms-2 mb-0 d-flex align-items-center gap-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="selectAllStudents"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
              <label className="form-check-label small fw-medium text-muted" htmlFor="selectAllStudents">
                Select all ({selectedStudents.length} selected)
              </label>
            </div>

            {selectedStudents.length > 0 && (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => alert(`Emailing ${selectedStudents.length} selected students...`)}
                >
                  <i className="bi bi-envelope"></i> Email
                </button>
                <button
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  onClick={() => {
                    alert(`Removed ${selectedStudents.length} selected students.`);
                    setSelectedStudents([]);
                  }}
                >
                  <i className="bi bi-person-x"></i> Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* Students List */}
        {students.length > 0 ? (
          <div className="d-flex flex-column">
            {students.map((st) => (
              <div
                key={st.id}
                className="d-flex align-items-center justify-content-between py-2 px-3 border-bottom hover-bg-light"
                style={{ transition: 'background 0.15s' }}
              >
                <div className="d-flex align-items-center gap-3">
                  {user.role === 'teacher' && (
                    <input
                      type="checkbox"
                      className="form-check-input mb-0 me-1"
                      checked={selectedStudents.includes(st.id)}
                      onChange={() => toggleStudent(st.id)}
                    />
                  )}
                  <Avatar name={st.name} size={40} color="#00897b" />
                  <div>
                    <div className="fw-medium text-dark">{st.name}</div>
                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>{st.email}</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-1">
                  <a
                    href={`mailto:${st.email}`}
                    className="btn btn-icon text-secondary"
                    title={`Email ${st.name}`}
                  >
                    <i className="bi bi-envelope"></i>
                  </a>
                  {user.role === 'teacher' && (
                    <div className="dropdown">
                      <button className="btn btn-icon text-secondary" data-bs-toggle="dropdown" aria-expanded="false">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow border small">
                        <li>
                          <button className="dropdown-item py-2" onClick={() => alert(`Muted ${st.name}`)}>
                            <i className="bi bi-volume-mute me-2"></i> Mute student
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item py-2 text-danger" onClick={() => alert(`Removed ${st.name}`)}>
                            <i className="bi bi-person-x me-2"></i> Remove
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-white border rounded-3 shadow-sm">
            <i className="bi bi-people text-muted fs-1 mb-2"></i>
            <h6 className="fw-semibold text-dark">No students here</h6>
            <p className="text-muted small mb-0">Invite students or give them the class code: <strong className="font-monospace text-primary">{cls.code}</strong></p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">Invite students or teachers</h5>
                <button className="btn-close" onClick={() => setShowInviteModal(false)}></button>
              </div>

              <form onSubmit={handleInvite}>
                <div className="modal-body p-4">
                  <p className="text-muted small mb-3">
                    Invite link: <span className="font-monospace text-primary bg-light px-2 py-1 rounded border small">https://classroom.google.com/c/{cls.code}</span>
                  </p>

                  <div className="form-floating mb-2">
                    <input
                      type="email"
                      className="form-control"
                      id="inviteEmail"
                      placeholder="Type a name or email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      autoFocus
                      required
                    />
                    <label htmlFor="inviteEmail">Type a name or email</label>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-light fw-medium px-4" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-medium px-4"
                    style={{ backgroundColor: cls.themeColor || '#1a73e8' }}
                    disabled={!inviteEmail.trim()}
                  >
                    Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PeopleTab;
