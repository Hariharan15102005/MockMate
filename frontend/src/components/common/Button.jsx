import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
  ...props
}) => {
  const sizeStyles = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' },
    md: { padding: '0.625rem 1.125rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' }
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ ...sizeStyles[size], ...style }}
      {...props}
    >
      {loading ? (
        <span className="spinner-border" style={{
          width: '14px',
          height: '14px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderTopColor: '#ffffff',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.8s linear infinite'
        }} />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
        </>
      )}
    </button>
  );
};

export default Button;
