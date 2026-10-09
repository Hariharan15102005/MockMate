import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Button from './Button';

export const ErrorState = ({
  title = 'Unable to load data',
  message = 'An unexpected error occurred while communicating with the backend services.',
  onRetry,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2.5rem 1.5rem',
        borderColor: 'var(--danger-border)',
        background: 'rgba(239, 68, 68, 0.04)',
        ...style
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}
      >
        <AlertTriangle size={24} />
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5, marginBottom: onRetry ? '1.25rem' : 0 }}>
        {message}
      </p>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={RotateCcw}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
