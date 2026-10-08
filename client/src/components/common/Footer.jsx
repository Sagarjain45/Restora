import React from 'react';
import { Shield, Layers, Database } from 'lucide-react';

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
            Restora Restaurant Management System
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Multi-Tenant SaaS Architecture • Built on the MERN Stack
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={14} color="var(--accent-primary)" />
            <span>React + Vite</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={14} color="var(--accent-success)" />
            <span>Node + Express + MongoDB</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={14} color="var(--accent-cyan)" />
            <span>Tenant Isolation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
