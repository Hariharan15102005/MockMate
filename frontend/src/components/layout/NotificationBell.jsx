import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
          background: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.15s ease'
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
      </button>

      {isOpen && (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '320px',
            padding: 0,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            zIndex: 50
          }}
        >
          <div
            style={{
              padding: '0.875rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.6)'
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Notifications
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              0 new
            </span>
          </div>

          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto'
              }}
            >
              <CheckCheck size={20} />
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              No notifications yet
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              System updates and interview alerts will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
