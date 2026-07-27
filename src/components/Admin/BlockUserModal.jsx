import React, { useState } from 'react';

const BlockUserModal = ({ show, user, onClose, onSubmit, isLoading }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onSubmit(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-3">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-shield-lock-fill text-danger me-2"></i>
              Block User
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={isLoading}
            ></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3 small">
              Are you sure you want to block <strong>{user?.email}</strong>?
            </p>
            <div className="alert alert-warning d-flex align-items-start mb-3 small">
              <i className="bi bi-exclamation-triangle-fill me-2 mt-1 flex-shrink-0"></i>
              <small>
                This user will no longer be able to access the system until unblocked.
              </small>
            </div>
            <div className="mb-3">
              <label htmlFor="blockReason" className="form-label">
                Reason for Blocking <span className="text-muted">(optional)</span>
              </label>
              <textarea
                id="blockReason"
                className="form-control"
                rows="3"
                placeholder="Enter reason for blocking..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isLoading}
                maxLength="1000"
              ></textarea>
              <small className="text-muted d-block mt-1">
                {reason.length}/1000 characters
              </small>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-2"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger rounded-2"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Blocking...
                </>
              ) : (
                <>
                  <i className="bi bi-check me-2"></i>
                  Block User
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockUserModal;
