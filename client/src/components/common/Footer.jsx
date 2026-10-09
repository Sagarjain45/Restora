import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(9, 13, 22, 0.9)',
      padding: '2.5rem 1.5rem',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
            Restora Restaurant Management
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            All-in-one operations platform for table seating, kitchen order flow, billing, and analytics.
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          © {new Date().getFullYear()} Restora POS. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
