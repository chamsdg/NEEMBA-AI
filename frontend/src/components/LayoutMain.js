import React from 'react';
import Sidebar from './Sidebar';
import './LayoutMain.css';

function LayoutMain({ user, onLogout, children }) {
  return (
    <div className="layout">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="main-content">
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default LayoutMain;
