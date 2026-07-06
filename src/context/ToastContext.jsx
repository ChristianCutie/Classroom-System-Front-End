import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const resolvedOptions = typeof options === 'string' ? { type: options } : options;
    const toast = {
      id,
      message,
      type: resolvedOptions.type || 'info',
      duration: resolvedOptions.duration ?? 3000,
    };

    setToasts((prev) => [...prev, toast]);

    if (toast.duration > 0) {
      window.setTimeout(() => removeToast(id), toast.duration);
    }

    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
