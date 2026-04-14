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
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fff',
          fontFamily: 'sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#ff4d4d' }}>Something went wrong.</h1>
          <p style={{ opacity: 0.8, maxWidth: '500px' }}>
            The application encountered an unexpected error. We've been notified and are looking into it.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Back to Safety
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
