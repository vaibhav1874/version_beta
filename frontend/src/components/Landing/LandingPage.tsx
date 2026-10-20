/**
 * Project JEEVAN — Sci-Fi / DataV Landing Page & Mission Portal
 * Futuristic telemetry showcase, live crisis counters, hazard matrix, and instant command access.
 */

import React from 'react';
import type { Incident } from '../../types/incident';

interface LandingPageProps {
  incidents: Incident[];
  onOpenCommandCenter: () => void;
  onOpenReportModal: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  incidents,
  onOpenCommandCenter,
  onOpenReportModal,
  onSeedDemo,
  isSeeding,
}) => {
  // Compute aggregate threat metrics
  const activeCount = incidents.length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' || (i.ai_priority_score && i.ai_priority_score >= 8)).length;
  const verifiedCount = incidents.filter(i => i.is_verified).length;
  const avgRiskScore = incidents.length > 0
    ? (incidents.reduce((sum, i) => sum + (i.ai_priority_score || 5), 0) / incidents.length).toFixed(1)
    : '4.2';

  return (
    <div className="landing-container" id="jeevan-landing-portal">
      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="hero-bracket-top">
          <span className="bracket-tag">CIVIL DEFENSE OPERATIONS</span>
          <span className="bracket-tag">MULTI-HAZARD EMERGENCY COORDINATION</span>
        </div>

        <div className="hero-content">
          <div className="hero-badge-pill">
            <span className="hero-radar-dot"></span>
            OPERATIONAL CIVIL DEFENSE & CRISIS COORDINATION
          </div>

          <h1 className="hero-glitch-title">
            PROJECT <span className="title-neon-highlight">JEEVAN</span>
          </h1>

          <p className="hero-subtitle">
            Autonomous multi-hazard telemetry, spatial duplicate detection, and transparent priority scoring for rapid crisis mobilization.
          </p>

          <div className="hero-cta-group">
            <button
              id="landing-enter-command-btn"
              className="cyber-btn-primary"
              onClick={onOpenCommandCenter}
            >
              <span className="btn-icon">⚡</span>
              <span>OPEN COMMAND CENTER</span>
            </button>

            <button
              id="landing-report-incident-btn"
              className="cyber-btn-secondary"
              onClick={onOpenReportModal}
            >
              <span className="btn-icon">🚨</span>
              <span>REPORT INCIDENT</span>
            </button>

            <button
              id="landing-seed-demo-btn"
              className="cyber-btn-ghost"
              onClick={onSeedDemo}
              disabled={isSeeding}
            >
              <span>{isSeeding ? 'INJECTING SIMULATION...' : 'LOAD DEMO SCENARIO'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Tactical Telemetry HUD Bar */}
      <section className="landing-telemetry-strip" id="live-telemetry-summary">
        <div className="telemetry-card">
          <div className="telemetry-header">
            <span className="telemetry-icon">📡</span>
            <span className="telemetry-label">ACTIVE THREATS</span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value text-cyan">{activeCount}</span>
            <span className="telemetry-delta">LIVE SECTORS</span>
          </div>
          <div className="telemetry-bar"><div className="telemetry-fill" style={{ width: `${Math.min(100, activeCount * 20)}%` }}></div></div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-header">
            <span className="telemetry-icon">🔥</span>
            <span className="telemetry-label">CRITICAL EMERGENCIES</span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value text-red">{criticalCount}</span>
            <span className="telemetry-delta">IMMEDIATE ACTION</span>
          </div>
          <div className="telemetry-bar"><div className="telemetry-fill fill-red" style={{ width: `${Math.min(100, criticalCount * 25)}%` }}></div></div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-header">
            <span className="telemetry-icon">⚖️</span>
            <span className="telemetry-label">AVG RISK INDEX</span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value text-amber">{avgRiskScore}<span className="unit">/10</span></span>
            <span className="telemetry-delta">EXPLAINABLE SCALE</span>
          </div>
          <div className="telemetry-bar"><div className="telemetry-fill fill-amber" style={{ width: `${parseFloat(avgRiskScore) * 10}%` }}></div></div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-header">
            <span className="telemetry-icon">🛡️</span>
            <span className="telemetry-label">VERIFIED RESPONSES</span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value text-green">{verifiedCount}</span>
            <span className="telemetry-delta">DISPATCHED TEAMS</span>
          </div>
          <div className="telemetry-bar"><div className="telemetry-fill fill-green" style={{ width: `${Math.min(100, verifiedCount * 30)}%` }}></div></div>
        </div>
      </section>

      {/* Four Hazard Threat Pillars */}
      <section className="landing-pillars-section">
        <div className="section-hud-title">
          <span className="title-code">OPERATIONAL DOMAINS</span>
          <h2>SUPPORTED EMERGENCY CATEGORIES</h2>
          <p>Domain-adapted triage logic tuned specifically for urban critical hazards with explainable scoring.</p>
        </div>

        <div className="hazard-pillars-grid">
          <div className="hazard-pillar-card flood-pillar">
            <div className="pillar-header">
              <span className="pillar-icon">🌊</span>
              <span className="pillar-tag">VECTOR 01</span>
            </div>
            <h3>Flooding & Waterlogging</h3>
            <p>Monitors submerged arterial underpasses, road depth markers, trapped passenger vehicles, and critical drainage choke points.</p>
            <ul className="pillar-features">
              <li>✓ Water level submersion factor</li>
              <li>✓ Critical transit hub proximity</li>
              <li>✓ Life entrapment priority boost</li>
            </ul>
          </div>

          <div className="hazard-pillar-card fire-pillar">
            <div className="pillar-header">
              <span className="pillar-icon">🔥</span>
              <span className="pillar-tag">VECTOR 02</span>
            </div>
            <h3>Structural Fires & Smoke</h3>
            <p>Rapid detection of commercial HVAC short circuits, residential high-rise smoke plumes, and combustible LPG cylinder hazards.</p>
            <ul className="pillar-features">
              <li>✓ Explosive / gas material flags</li>
              <li>✓ High-density lateral spread tracking</li>
              <li>✓ Immediate evacuation alerting</li>
            </ul>
          </div>

          <div className="hazard-pillar-card weather-pillar">
            <div className="pillar-header">
              <span className="pillar-icon">🌪️</span>
              <span className="pillar-tag">VECTOR 03</span>
            </div>
            <h3>Severe Storms & Debris</h3>
            <p>Tracks squall damage, uprooted banyan trees blocking both carriageway directions, and high-voltage live snapped electrical wires.</p>
            <ul className="pillar-features">
              <li>✓ Live electrocution hazard alerts</li>
              <li>✓ Arterial evacuation corridor checks</li>
              <li>✓ Municipal tree crew routing</li>
            </ul>
          </div>

          <div className="hazard-pillar-card accident-pillar">
            <div className="pillar-header">
              <span className="pillar-icon">🚗</span>
              <span className="pillar-tag">VECTOR 04</span>
            </div>
            <h3>Arterial Accidents & Collisions</h3>
            <p>Coordinates heavy vehicle transit pileups, hazardous diesel spills on flyovers, and emergency medical triage dispatch.</p>
            <ul className="pillar-features">
              <li>✓ Multi-vehicle mass casualty triage</li>
              <li>✓ Fuel spill fire prevention</li>
              <li>✓ Trauma ambulance link</li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI Principles & Explainability */}
      <section className="landing-ai-section">
        <div className="section-hud-title">
          <span className="title-code">DECISION SUPPORT ARCHITECTURE</span>
          <h2>TRANSPARENT, EXPLAINABLE INTELLIGENCE</h2>
          <p>Why Project JEEVAN eliminates opaque black-boxes in favor of dispatcher-verifiable decision support.</p>
        </div>

        <div className="ai-features-grid">
          <div className="ai-spec-card">
            <div className="ai-spec-number">01</div>
            <h4>Explainable Priority Scoring</h4>
            <p>Every risk rating from 1 to 10 is accompanied by a transparent bulleted rationale (e.g. depth &gt; 2ft, proximity to metro station), giving dispatchers full auditability.</p>
          </div>

          <div className="ai-spec-card">
            <div className="ai-spec-number">02</div>
            <h4>Spatial & Semantic Duplication Guard</h4>
            <p>Uses Haversine geodesic calculation and character tri-gram overlap to detect redundant reports without discarding citizen voices or producing false positives.</p>
          </div>

          <div className="ai-spec-card">
            <div className="ai-spec-number">03</div>
            <h4>Local-First & Zero Paid API Lock-In</h4>
            <p>Powered entirely by local Python heuristics, open-source computer vision extraction, and OpenStreetMap/CARTO dark cartography.</p>
          </div>
        </div>
      </section>

      {/* Footer Strip */}
      <footer className="landing-footer">
        <div className="footer-left">
          <span className="brand-dot"></span>
          <span>PROJECT JEEVAN — EMERGENCY OPERATIONS & CIVIL DEFENSE PLATFORM</span>
        </div>
        <div className="footer-right">
          <span>AI outputs are preliminary decision aids. Human dispatch verification required.</span>
        </div>
      </footer>
    </div>
  );
};
