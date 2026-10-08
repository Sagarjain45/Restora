import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught an uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#090d16',
          color: '#f8fafc'
        }}>
          <div className="glass-panel" style={{ maxWidth: '550px', padding: '2.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              An unexpected error occurred in the application view.
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '1rem',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              textAlign: 'left',
              color: '#fca5a5',
              marginBottom: '1.5rem',
              overflowX: 'auto'
            }}>
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
