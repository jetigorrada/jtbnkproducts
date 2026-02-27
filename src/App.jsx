import { useState } from 'react';
import { endpoints, methodColors } from './endpoints';
import EndpointForm from './components/EndpointForm';
import Login from './components/Login';
import { isAuthenticated, logout } from './auth';
import './App.css';

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [selectedId, setSelectedId] = useState(endpoints[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  const selectedEndpoint = endpoints.find((e) => e.id === selectedId);

  // Group endpoints by tag with icons
  const tagIcons = {
    Products: '📦',
    Categories: '📂',
    Hierarchies: '🌳',
  };

  const grouped = endpoints.reduce((acc, ep) => {
    const tag = ep.tag;
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(ep);
    return acc;
  }, {});

  const handleLogout = () => {
    logout();
    setAuthed(false);
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="app-title">Product Directory</h1>
          <span className="app-version">API v1.3.0</span>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(grouped).map(([tag, eps]) => (
            <div key={tag} className="nav-group">
              <h2 className="nav-group-title">{tagIcons[tag] || '📋'} {tag}</h2>
              {eps.map((ep) => {
                const mc = methodColors[ep.method];
                return (
                  <button
                    key={ep.id}
                    className={`nav-item ${selectedId === ep.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(ep.id)}
                  >
                    <span
                      className="nav-method"
                      style={{ color: mc.color }}
                    >
                      {ep.method}
                    </span>
                    <span className="nav-label">{ep.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Toggle sidebar on mobile */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      {/* Main content */}
      <main className="main-content">
        {selectedEndpoint && (
          <EndpointForm key={selectedEndpoint.id} endpoint={selectedEndpoint} />
        )}
      </main>
    </div>
  );
}

export default App;
