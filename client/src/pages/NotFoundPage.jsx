import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1rem',
      textAlign: 'center',
    }}>
      <div className="glass-panel" style={{ padding: '3rem 2rem', maxWidth: '480px', width: '100%' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <Compass size={28} color="var(--accent-danger)" />
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>404 Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
          The requested page or resource could not be found within this route.
        </p>
        <Link to="/" className="btn-primary">
          Back to Overview
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
