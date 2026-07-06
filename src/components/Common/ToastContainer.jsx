import React from 'react';
import { useToast } from '@/context/ToastContext.jsx';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 2100, maxWidth: '360px', width: '100%' }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast show align-items-center text-white border-0 mb-2 ${
            toast.type === 'success'
              ? 'bg-success'
              : toast.type === 'error'
                ? 'bg-danger'
                : toast.type === 'warning'
                  ? 'bg-warning text-dark'
                  : 'bg-primary'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="d-flex w-100 align-items-start px-3 py-2">
            <div className="me-2 mt-1">
              {toast.type === 'success' ? (
                <i className="bi bi-check-circle-fill"></i>
              ) : toast.type === 'error' ? (
                <i className="bi bi-exclamation-circle-fill"></i>
              ) : toast.type === 'warning' ? (
                <i className="bi bi-exclamation-triangle-fill"></i>
              ) : (
                <i className="bi bi-info-circle-fill"></i>
              )}
            </div>
            <div className="flex-grow-1 small fw-medium">{toast.message}</div>
            <button
              type="button"
              className="btn-close btn-close-white ms-2"
              aria-label="Close"
              onClick={() => removeToast(toast.id)}
            ></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
