import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import { X } from 'lucide-react';

export const MobileSidebar = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '280px',
          maxWidth: '80%',
          height: '100%',
          backgroundColor: '#0f172a',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            color: 'var(--text-muted)',
            padding: '4px'
          }}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Sidebar onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;
