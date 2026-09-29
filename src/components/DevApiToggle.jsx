import React from 'react';

export default function DevApiToggle() {
  // Completely hide in production
  if (!import.meta.env.DEV) return null;

  const currentApi = localStorage.getItem('preferred_api') || 'render';

  const toggleApi = () => {
    const newApi = currentApi === 'render' ? 'local' : 'render';
    localStorage.setItem('preferred_api', newApi);
    window.location.reload();
  };

  return (
    <div style={{
      background: '#fef3c7', 
      color: '#b45309', 
      padding: '0.5rem', 
      textAlign: 'center', 
      fontWeight: 'bold', 
      fontSize: '0.85rem', 
      display: 'flex', 
      justifyContent: 'center', 
      gap: '1rem', 
      alignItems: 'center',
      zIndex: 9999,
      position: 'relative'
    }}>
      <span>[DEV MODE] Backend: {currentApi === 'local' ? 'http://localhost:8080' : 'Render (Deployed)'}</span>
      <button onClick={toggleApi} style={{
        padding: '0.2rem 0.75rem', 
        background: '#d97706', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer', 
        fontSize: '0.75rem',
        fontWeight: 'bold'
      }}>
        Switch to {currentApi === 'local' ? 'Render' : 'Local'}
      </button>
    </div>
  );
}
