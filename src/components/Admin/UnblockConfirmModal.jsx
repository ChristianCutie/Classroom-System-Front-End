import React, { useState } from 'react';

const UnblockConfirmModal = ({ show, user, onClose, onSubmit, isLoading }) => {
  const handleSubmit = () => {
    onSubmit();
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-3">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-shield-check-fill text-warning me-2"></i>
              Unblock User
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isLoading}
            ></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3 small">
              Are you sure you want to unblock <strong>{user?.email}</strong>?
            </p>
            <div className="alert alert-info d-flex align-items-start small">
              <i className="bi bi-info-circle-fill me-2 mt-1 flex-shrink-0"></i>
              <small>
                This user will regain access to the system and all its features.
              </small>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-2"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-warning rounded-2"
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
                  Unblocking...
                </>
              ) : (
                <>
                  <i className="bi bi-check me-2"></i>
                  Unblock User
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnblockConfirmModal;
