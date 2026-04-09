import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {}

export const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  
  const navItems = [
    { section: 'Main', items: [
      { path: '/', icon: '📊', label: 'Dashboard' },
      { path: '/companies', icon: '🏢', label: 'Companies' },
    ]},
    { section: 'Agents', items: [
      { path: '/agents', icon: '🤖', label: 'Agents', badge: '3' },
      { path: '/tasks', icon: '📋', label: 'Tasks' },
      { path: '/approvals', icon: '✅', label: 'Approvals', badge: '2' },
      { path: '/org-chart', icon: '📈', label: 'Org Chart' },
    ]},
    { section: 'System', items: [
      { path: '/logs', icon: '📝', label: 'Logs' },
      { path: '/settings', icon: '⚙️', label: 'Settings' },
    ]}
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">🔧</div>
          <span className="sidebar-logo-text">Qwen Paperclip</span>
          <span className="sidebar-logo-badge">v0.1</span>
        </Link>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((section, idx) => (
          <div key={idx} className="sidebar-section">
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="sidebar-link-badge">{item.badge}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="sidebar-status-dot" />
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
};
