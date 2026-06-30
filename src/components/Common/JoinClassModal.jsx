import React, { useState } from 'react';
import Avatar from './Avatar.jsx';

const JoinClassModal = ({ show, onClose, onJoin, user }) => {
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');

  if (!show) return null;

  const getDisplayName = (person) => {
    if (!person) return "User";
    const fullName = [person.first_name || person.firstName, person.last_name || person.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || person.fullName || person.name || "User";
  };

  const displayName = getDisplayName(user);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!classCode.trim() || classCode.trim().length < 5) {
      setError('Class code must be at least 5 characters');
      return;
    }
    const success = onJoin(classCode.trim().toLowerCase());
    if (success) {
      setClassCode('');
      setError('');
      onClose();
    } else {
      setError(`No class found with code "${classCode.trim()}". Check the code and try again.`);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '8px' }}>
          <div className="modal-header border-bottom-0 pt-4 px-4 pb-0">
            <h5 className="modal-title font-google fw-bold">Join class</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          
          <div className="modal-body p-4">
            <div className="border rounded p-3 mb-4 bg-light d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <Avatar name={user} size={42} color={user.color} />
                <div>
                  <div className="fw-semibold text-dark mb-0">{displayName}</div>
                  <div className="text-muted small">{user.email}</div>
                </div>
              </div>
              <button className="btn btn-outline-secondary btn-sm rounded-pill px-3">Switch account</button>
            </div>

            <form onSubmit={handleSubmit}>
              <h6 className="fw-semibold text-dark mb-1">Class code</h6>
              <p className="text-muted small mb-3">Ask your teacher for the class code, then enter it here.</p>
              
              {error && <div className="alert alert-danger py-2 text-sm">{error}</div>}

              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control font-monospace"
                  id="classCodeInput"
                  placeholder="Class code"
                  value={classCode}
                  onChange={(e) => {
                    setClassCode(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  maxLength={10}
                />
                <label htmlFor="classCodeInput">Class code (e.g. rcbt50a)</label>
              </div>

              <div className="text-muted small">
                <p className="mb-1 fw-medium">To sign in with a class code:</p>
                <ul className="mb-0 ps-3">
                  <li>Use an authorized account</li>
                  <li>Use a class code with 5-7 letters or numbers, and no spaces or symbols</li>
                </ul>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-light px-4 fw-medium text-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn text-white px-4 fw-medium"
                  style={{ backgroundColor: '#1a73e8' }}
                  disabled={classCode.trim().length < 5}
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinClassModal;
