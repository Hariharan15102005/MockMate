import React from 'react';
import { CheckCircle2, Clock, Send, FileText, AlertCircle } from 'lucide-react';

export const ActivityTimeline = ({
  events = [],
  emptyMessage = 'No recent activity recorded.',
  className = '',
  style = {}
}) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="var(--success)" />;
      case 'sent':
        return <Send size={16} color="var(--accent-purple)" />;
      case 'report':
        return <FileText size={16} color="var(--info)" />;
      case 'alert':
        return <AlertCircle size={16} color="var(--warning)" />;
      default:
        return <Clock size={16} color="var(--primary)" />;
    }
  };

  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', ...style }}>
      {events.map((event, idx) => (
        <div key={event.id || idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div
            style={{
              padding: '0.4rem',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '0.15rem'
            }}
          >
            {getIcon(event.type)}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {event.title}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {event.timestamp || event.time}
              </span>
            </div>
            {event.description && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
