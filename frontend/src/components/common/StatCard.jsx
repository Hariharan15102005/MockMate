import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple'
  trend,
  trendDirection = 'up', // 'up' | 'down' | 'neutral'
  className = '',
  style = {}
}) => {
  const colorMap = {
    indigo: {
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.25)',
      text: '#818cf8'
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)',
      text: '#34d399'
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)',
      text: '#fbbf24'
    },
    rose: {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.25)',
      text: '#f87171'
    },
    cyan: {
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.25)',
      text: '#38bdf8'
    },
    purple: {
      bg: 'rgba(168, 85, 247, 0.12)',
      border: 'rgba(168, 85, 247, 0.25)',
      text: '#c084fc'
    }
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        ...style
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.35rem', lineHeight: 1.1 }}>
            {value}
          </div>
        </div>
        {Icon && (
          <div style={{
            padding: '0.625rem',
            borderRadius: 'var(--radius-md)',
            background: currentTheme.bg,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={22} />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{ marginTop: '0.875rem', paddingTop: '0.625rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          {subtitle && <span style={{ color: 'var(--text-muted)' }}>{subtitle}</span>}
          {trend && (
            <span style={{
              fontWeight: '600',
              color: trendDirection === 'up' ? 'var(--success)' : trendDirection === 'down' ? 'var(--danger)' : 'var(--text-secondary)'
            }}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
