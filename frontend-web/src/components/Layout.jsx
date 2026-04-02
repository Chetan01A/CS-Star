import React from 'react';
import Sidebar from './Sidebar';

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Sidebar />
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        minHeight: '100vh',
        width: 'calc(100% - 280px)',
        transition: 'margin-left 0.25s ease, width 0.25s ease'
      }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
