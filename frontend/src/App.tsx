/**
 * Project JEEVAN — Main Application
 * AI-Assisted Multi-Hazard Emergency Intelligence & Response Coordination Platform.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import type { Incident, HazardCategory } from './types/incident';
import { MapDashboard } from './components/Map/MapDashboard';
import { ReportForm } from './components/Incidents/ReportForm';
import { IncidentDetail } from './components/Incidents/IncidentDetail';

export const App: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [systemOnline, setSystemOnline] = useState(true);

  // Fetch incidents from backend
  const fetchIncidents = useCallback(async () => {
    try {
      const filters = activeCategoryFilter !== 'all'
        ? { category: activeCategoryFilter as HazardCategory }
        : undefined;
      const data = await api.getIncidents(filters);
      setIncidents(data);
      setSystemOnline(true);
    } catch (err) {
      console.error('Failed to fetch incidents', err);
      setSystemOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategoryFilter]);

  // Initial fetch and auto-refresh polling every 12 seconds
  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 12000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  // Handle new incident submission
  const handleIncidentCreated = (newIncident: Incident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncident(newIncident);
  };

  // Handle incident update
  const handleIncidentUpdated = (updated: Incident) => {
    setIncidents((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setSelectedIncident(updated);
  };

  // Helper for category emoji
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'flood': return '🌊';
      case 'fire': return '🔥';
      case 'severe_weather': return '🌪️';
      case 'road_accident': return '🚗';
      default: return '⚠️';
    }
  };

  return (
    <div className="app-container">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => setSelectedIncident(null)}>
          <div className="brand-badge">JEEVAN</div>
          <div className="brand-text">
            <h1>Project JEEVAN</h1>
            <span className="brand-tagline">
              Emergency Intelligence & Response Platform
            </span>
          </div>
        </div>

        <div className="nav-links">
          <div className="system-pill" id="system-status-indicator">
            <span className="live-dot" />
            <span>{systemOnline ? 'AI Coordination Live' : 'Reconnecting...'}</span>
          </div>

          <button
            id="open-report-incident-modal-btn"
            className="report-action-btn"
            onClick={() => setIsReportModalOpen(true)}
          >
            <span>🚨</span>
            <span>Report Incident</span>
          </button>
        </div>
      </header>

      {/* ── Main Dashboard Workspace ──────────────────────────────────── */}
      <main className="main-content">
        <div className="dashboard-grid">
          {/* Left Feed Column */}
          <aside className="feed-pane">
            <div className="feed-header">
              <div className="feed-title-row">
                <h2>Active Incidents</h2>
                <span className="incident-count-pill" id="active-incidents-count">
                  {incidents.length} reported
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="filter-tabs" id="category-filters-container">
                <button
                  id="filter-all"
                  className={`filter-chip ${activeCategoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategoryFilter('all')}
                >
                  All ({incidents.length})
                </button>
                <button
                  id="filter-flood"
                  className={`filter-chip ${activeCategoryFilter === 'flood' ? 'active' : ''}`}
                  onClick={() => setActiveCategoryFilter('flood')}
                >
                  🌊 Flooding
                </button>
                <button
                  id="filter-fire"
                  className={`filter-chip ${activeCategoryFilter === 'fire' ? 'active' : ''}`}
                  onClick={() => setActiveCategoryFilter('fire')}
                >
                  🔥 Fires
                </button>
                <button
                  id="filter-weather"
                  className={`filter-chip ${activeCategoryFilter === 'severe_weather' ? 'active' : ''}`}
                  onClick={() => setActiveCategoryFilter('severe_weather')}
                >
                  🌪️ Storm / Weather
                </button>
                <button
                  id="filter-accident"
                  className={`filter-chip ${activeCategoryFilter === 'road_accident' ? 'active' : ''}`}
                  onClick={() => setActiveCategoryFilter('road_accident')}
                >
                  🚗 Accidents
                </button>
              </div>
            </div>

            {/* List of Incident Cards */}
            <div className="feed-list" id="incidents-feed-list">
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Scanning emergency channels...
                </div>
              ) : incidents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</p>
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No active incidents reported</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Click "Report Incident" above to transmit the first report.
                  </p>
                </div>
              ) : (
                incidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <article
                      key={inc.id}
                      id={`incident-card-${inc.id}`}
                      className={`incident-card cat-${inc.category} ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedIncident(inc)}
                    >
                      <div className="card-top">
                        <span className={`card-category-badge cat-badge-${inc.category}`}>
                          {getCategoryEmoji(inc.category)} {inc.category.replace('_', ' ')}
                        </span>
                        <span className={`badge-status status-${inc.status}`}>
                          {inc.status}
                        </span>
                      </div>

                      <h3 className="card-title">{inc.title}</h3>
                      <p className="card-desc">{inc.description}</p>

                      <div className="card-meta">
                        <span>
                          {inc.address ? `📍 ${inc.address}` : `Coord: ${inc.latitude.toFixed(2)}, ${inc.longitude.toFixed(2)}`}
                        </span>
                        {inc.is_verified ? (
                          <span style={{ color: '#34d399', fontWeight: 600 }}>✓ Verified</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unverified</span>
                        )}
                      </div>

                      {inc.ai_duplicate_of_id && (
                        <div style={{ marginTop: '0.4rem' }}>
                          <span className="badge-ai-notice">
                            ⚠️ Duplicate match of #{inc.ai_duplicate_of_id}
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Map View with Floating Inspector */}
          <section className="map-pane">
            <MapDashboard
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />

            {/* Floating Incident Detail Panel */}
            {selectedIncident && (
              <IncidentDetail
                incident={selectedIncident}
                onClose={() => setSelectedIncident(null)}
                onIncidentUpdated={handleIncidentUpdated}
              />
            )}
          </section>
        </div>
      </main>

      {/* ── Report Modal ──────────────────────────────────────────────── */}
      <ReportForm
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />
    </div>
  );
};

export default App;
