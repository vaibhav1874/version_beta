/**
 * Project JEEVAN — Main Application
 * AI-Assisted Multi-Hazard Emergency Intelligence & Response Coordination Platform.
 * Sci-Fi Cybernetic / DataV Command Center & Mission Portal.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import type { Incident, HazardCategory } from './types/incident';
import { MapDashboard } from './components/Map/MapDashboard';
import { ReportForm } from './components/Incidents/ReportForm';
import { IncidentDetail } from './components/Incidents/IncidentDetail';
import { LandingPage } from './components/Landing/LandingPage';

export const App: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [systemOnline, setSystemOnline] = useState(true);
  const [activeView, setActiveView] = useState<'portal' | 'command'>('portal');
  const [isSeeding, setIsSeeding] = useState(false);

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
    setActiveView('command');
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

  // Helper for risk score number calculation
  const getRiskScore = (inc: Incident): number => {
    if (typeof inc.ai_priority_score === 'number' && inc.ai_priority_score > 0) {
      return Math.min(10, Math.max(1, Math.round(inc.ai_priority_score)));
    }
    if (typeof inc.priority_score === 'number' && inc.priority_score > 0) {
      return Math.min(10, Math.max(1, Math.round(inc.priority_score)));
    }
    switch (inc.severity) {
      case 'critical': return 9;
      case 'high': return 7;
      case 'medium': return 5;
      case 'low': return 3;
      default: return 5;
    }
  };

  const handleSeedSimulation = async () => {
    setIsSeeding(true);
    try {
      await api.seedSimulation();
      await fetchIncidents();
    } catch (err) {
      console.error('Failed to seed simulation scenario', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Aggregate metrics for Command Header Strip
  const criticalCount = incidents.filter(i => i.severity === 'critical' || getRiskScore(i) >= 8).length;
  const verifiedCount = incidents.filter(i => i.is_verified).length;
  const avgRisk = incidents.length > 0
    ? (incidents.reduce((acc, cur) => acc + getRiskScore(cur), 0) / incidents.length).toFixed(1)
    : '0.0';

  return (
    <div className="app-container">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => setActiveView('portal')}>
          <div className="brand-badge">JEEVAN</div>
          <div className="brand-text">
            <h1>Project JEEVAN</h1>
            <span className="brand-tagline">
              Emergency Operations & Response Platform
            </span>
          </div>
        </div>

        {/* View Switcher Tabs (Portal vs Command Center) */}
        <div className="nav-view-switcher" style={{ display: 'flex', gap: '0.35rem', background: '#14161c', padding: '4px', borderRadius: '6px', border: '1px solid #282c38' }}>
          <button
            id="nav-tab-landing-portal"
            className={`nav-btn ${activeView === 'portal' ? 'active' : ''}`}
            onClick={() => setActiveView('portal')}
            style={{
              padding: '0.4rem 0.9rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: activeView === 'portal' ? 'rgba(245, 159, 10, 0.15)' : 'transparent',
              color: activeView === 'portal' ? '#f59f0a' : '#94a3b8',
              border: activeView === 'portal' ? '1px solid rgba(245, 159, 10, 0.4)' : '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🌐 OVERVIEW PORTAL
          </button>
          <button
            id="nav-tab-command-matrix"
            className={`nav-btn ${activeView === 'command' ? 'active' : ''}`}
            onClick={() => setActiveView('command')}
            style={{
              padding: '0.4rem 0.9rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: activeView === 'command' ? 'rgba(245, 159, 10, 0.15)' : 'transparent',
              color: activeView === 'command' ? '#f59f0a' : '#94a3b8',
              border: activeView === 'command' ? '1px solid rgba(245, 159, 10, 0.4)' : '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            ⚡ DISPATCH COMMAND
          </button>
        </div>

        <div className="nav-links">
          <div className="system-pill" id="system-status-indicator">
            <span className="live-dot" />
            <span>{systemOnline ? 'Telemetry Operational' : 'Reconnecting...'}</span>
          </div>

          <button
            id="seed-simulation-demo-btn"
            className="nav-btn"
            style={{
              border: '1px solid #2e3442',
              background: '#1f232d',
              color: '#cbd5e1',
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
            }}
            onClick={handleSeedSimulation}
            disabled={isSeeding}
            title="Load emergency demo simulation data"
          >
            <span>⚡</span>
            <span>{isSeeding ? 'Injecting...' : 'Demo Scenario'}</span>
          </button>

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

      {/* ── View Router: Landing Portal vs Live Command Center ───────── */}
      {activeView === 'portal' ? (
        <LandingPage
          incidents={incidents}
          onOpenCommandCenter={() => setActiveView('command')}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onSeedDemo={handleSeedSimulation}
          isSeeding={isSeeding}
        />
      ) : (
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Top Telemetry Metric Strip (Sci-Fi DataV HUD) */}
          <section className="command-telemetry-strip" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.8rem',
            padding: '0.6rem 1.25rem',
            background: 'linear-gradient(180deg, rgba(8, 14, 28, 0.95) 0%, rgba(5, 9, 18, 0.95) 100%)',
            borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          }}>
            <div className="telemetry-box" style={{
              background: 'rgba(13, 23, 42, 0.7)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              borderRadius: '6px',
              padding: '0.5rem 0.8rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ACTIVE SIGNALS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>{incidents.length}</div>
              </div>
              <div style={{ fontSize: '1.5rem', opacity: 0.8 }}>📡</div>
            </div>

            <div className="telemetry-box" style={{
              background: 'rgba(13, 23, 42, 0.7)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '6px',
              padding: '0.5rem 0.8rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CRITICAL HAZARDS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ff2a5f', fontFamily: 'monospace' }}>{criticalCount}</div>
              </div>
              <div style={{ fontSize: '1.5rem', opacity: 0.8 }}>🚨</div>
            </div>

            <div className="telemetry-box" style={{
              background: 'rgba(13, 23, 42, 0.7)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: '6px',
              padding: '0.5rem 0.8rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>VERIFIED GROUND TRUTH</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                  {verifiedCount} <span style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>({incidents.length > 0 ? Math.round((verifiedCount / incidents.length) * 100) : 0}%)</span>
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', opacity: 0.8 }}>🛡️</div>
            </div>

            <div className="telemetry-box" style={{
              background: 'rgba(13, 23, 42, 0.7)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '6px',
              padding: '0.5rem 0.8rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SYSTEM RISK INDEX</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
                  {avgRisk} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ 10</span>
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', opacity: 0.8 }}>⚡</div>
            </div>
          </section>

          {/* Incident Feed Column & Map Pane */}
          <div className="dashboard-grid" style={{ flex: 1, minHeight: 0 }}>
            {/* Left Feed Column */}
            <aside className="feed-pane">
              <div className="feed-header">
                <div className="feed-title-row">
                  <h2>Active Threat Incidents</h2>
                  <span className="incident-count-pill" id="active-incidents-count">
                    {incidents.length} signals
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

              {/* List of Incident Cards with Prominent Segmented LED Risk Gauge */}
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
                    const riskScore = getRiskScore(inc);
                    return (
                      <article
                        key={inc.id}
                        id={`incident-card-${inc.id}`}
                        className={`incident-card cat-${inc.category} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedIncident(inc)}
                      >
                        <div className="card-top">
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <span className={`card-category-badge cat-badge-${inc.category}`}>
                              {getCategoryEmoji(inc.category)} {inc.category.replace('_', ' ')}
                            </span>
                            {inc.source === 'simulation' ? (
                              <span style={{ fontSize: '0.62rem', background: 'rgba(234, 88, 12, 0.2)', color: '#fb923c', padding: '2px 5px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
                                SIMULATION
                              </span>
                            ) : inc.source === 'sensor' ? (
                              <span style={{ fontSize: '0.62rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 5px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
                                SENSOR
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.62rem', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '2px 5px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
                                CITIZEN
                              </span>
                            )}
                          </div>
                          <span className={`badge-status status-${inc.status}`}>
                            {inc.status}
                          </span>
                        </div>

                        <h3 className="card-title">{inc.title}</h3>

                        {/* ── Prominent Explainable Risk Score & 10-Segment LED Meter ── */}
                        <div className="card-risk-gauge" style={{
                          margin: '0.55rem 0',
                          padding: '0.45rem 0.6rem',
                          background: 'rgba(10, 15, 30, 0.75)',
                          borderRadius: '6px',
                          border: '1px solid rgba(0, 240, 255, 0.15)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>
                              THREAT LEVEL:
                            </span>
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              color: riskScore >= 8 ? '#ff2a5f' : riskScore >= 6 ? '#fbbf24' : '#38bdf8',
                              textShadow: riskScore >= 8 ? '0 0 8px rgba(255, 42, 95, 0.5)' : 'none',
                            }}>
                              {riskScore}/10 [{inc.severity.toUpperCase()}]
                            </span>
                          </div>
                          
                          {/* 10-Segment LED Meter */}
                          <div className="led-meter-track" style={{ display: 'flex', gap: '3px', height: '6px' }}>
                            {Array.from({ length: 10 }).map((_, idx) => {
                              const isActive = idx < riskScore;
                              let segmentColor = 'rgba(255, 255, 255, 0.08)';
                              if (isActive) {
                                if (idx >= 7) {
                                  segmentColor = '#ef4444';
                                } else if (idx >= 4) {
                                  segmentColor = '#f59f0a';
                                } else {
                                  segmentColor = '#3b82f6';
                                }
                              }
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    flex: 1,
                                    borderRadius: '2px',
                                    background: segmentColor,
                                    transition: 'all 0.2s ease',
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>

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
      )}

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
