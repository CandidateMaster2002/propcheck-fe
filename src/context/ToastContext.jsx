import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const COLORS = {
  success: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  error:   { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  warning: { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
  info:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
};

const ToastContainer = ({ toasts }) => (
  <div style={{
    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: '0.625rem',
    maxWidth: '360px', width: '100%',
  }}>
    {toasts.map(t => {
      const c = COLORS[t.type] || COLORS.success;
      return (
        <div key={t.id} style={{
          padding: '0.875rem 1.25rem',
          borderRadius: '0.625rem',
          border: `1px solid ${c.border}`,
          backgroundColor: c.bg,
          color: c.color,
          fontWeight: 500,
          fontSize: '0.875rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideIn 0.25s ease',
        }}>
          <span>{ICONS[t.type] || ICONS.success}</span>
          <span>{t.message}</span>
        </div>
      );
    })}
  </div>
);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
