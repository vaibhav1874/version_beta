/**
 * Project JEEVAN — Incident Detail & Coordination Panel
 * Floating inspector panel with status management, AI suggestions, and responder assignment.
 */

import React, { useState, useEffect } from 'react';
import { api, API_HOST } from '../../api/client';
import type {
  Incident,
  IncidentStatus,
  ResponderTeam,
  Assignment,
  TimelineEvent,
} from '../../types/incident';
import { geocodeAddress } from '../../utils/geocoding';

interface IncidentDetailProps {
  incident: Incident;
  onClose: () => void;
  onIncidentUpdated: (updated: Incident) => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  incident,
  onClose,
  onIncidentUpdated,
}) => {
  const [teams, setTeams] = useState<ResponderTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'coordination' | 'timeline'>('info');

  // Relocation state
  const [isRelocating, setIsRelocating] = useState(false);
  const [editLat, setEditLat] = useState(incident.latitude.toString());
  const [editLon, setEditLon] = useState(incident.longitude.toString());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [relocateMsg, setRelocateMsg] = useState<string | null>(null);

  // Sync edit coordinates when incident changes
  useEffect(() => {
    setEditLat(incident.latitude.toString());
    setEditLon(incident.longitude.toString());
    setIsRelocating(false);
    setRelocateMsg(null);
  }, [incident.id, incident.latitude, incident.longitude]);

  const handleAutoGeocodeAddress = async () => {
    if (!incident.address) return;
    setIsGeocoding(true);
    setRelocateMsg(null);
    try {
      const res = await geocodeAddress(incident.address);
      if (res) {
        setEditLat(res.latitude.toFixed(6));
        setEditLon(res.longitude.toFixed(6));
        setRelocateMsg(`Resolved: ${res.displayName}`);
      } else {
        setRelocateMsg('No coordinates found for this address. Enter manually.');
      }
    } catch (err) {
      console.warn('Geocoding error', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSaveLocation = async () => {
    const newLat = parseFloat(editLat);
    const newLon = parseFloat(editLon);
    if (isNaN(newLat) || isNaN(newLon)) {
      setRelocateMsg('Please enter valid numeric coordinates.');
      return;
    }
    setIsUpdating(true);
    try {
      const updated = await api.updateIncident(incident.id, {
        latitude: newLat,
        longitude: newLon,
      });
      onIncidentUpdated(updated);
      setIsRelocating(false);
      setRelocateMsg('Location successfully updated!');
    } catch (err: any) {
      console.error('Failed to update location', err);
      setRelocateMsg('Failed to update location on server.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Load responder teams, assignments, and timeline
  useEffect(() => {
    const loadDetails = async () => {
      try {
        const [loadedTeams, loadedAssignments, loadedTimeline] = await Promise.all([
          api.getResponders(),
          api.getAssignments(incident.id),
          api.getTimeline(incident.id),
        ]);
        setTeams(loadedTeams);
        setAssignments(loadedAssignments);
        setTimeline(loadedTimeline);
      } catch (err) {
        console.error('Failed to load incident coordination details', err);
      }
    };
    loadDetails();
  }, [incident.id]);

  // Toggle verification status
  const handleToggleVerification = async () => {
    setIsUpdating(true);
    try {
      const updated = await api.updateIncident(incident.id, {
        is_verified: !incident.is_verified,
        status: !incident.is_verified && incident.status === 'reported' ? 'verified' : incident.status,
      });
      onIncidentUpdated(updated);
      const newTimeline = await api.getTimeline(incident.id);
      setTimeline(newTimeline);
    } catch (err) {
      console.error('Error toggling verification', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Change incident status
  const handleStatusChange = async (newStatus: IncidentStatus) => {
    setIsUpdating(true);
    try {
      const updated = await api.updateIncident(incident.id, { status: newStatus });
      onIncidentUpdated(updated);
      const newTimeline = await api.getTimeline(incident.id);
      setTimeline(newTimeline);
    } catch (err) {
      console.error('Error changing status', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Assign team
  const handleAssignTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;

    setIsUpdating(true);
    try {
      await api.assignTeam(incident.id, parseInt(selectedTeamId), assignmentNote);
      setAssignmentNote('');
      setSelectedTeamId('');
      
      // Refresh assignments, incident status, and timeline
      const [refreshedInc, refreshedAssign, refreshedTime] = await Promise.all([
        api.getIncident(incident.id),
        api.getAssignments(incident.id),
        api.getTimeline(incident.id),
      ]);
      onIncidentUpdated(refreshedInc);
      setAssignments(refreshedAssign);
      setTimeline(refreshedTime);
    } catch (err) {
      console.error('Failed to assign team', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="map-detail-card" id={`incident-detail-panel-${incident.id}`}>
      <button
        id="close-incident-detail-btn"
        className="detail-close-btn"
        onClick={onClose}
        aria-label="Close details"
      >
        &times;
      </button>

      {/* Header Info */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
        <span className={`card-category-badge cat-badge-${incident.category}`}>
          {incident.category.replace('_', ' ')}
        </span>
        <span className={`badge-status status-${incident.status}`}>
          {incident.status}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          #{incident.id}
        </span>
      </div>

      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', lineHeight: 1.3 }}>
        {incident.title}
      </h3>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div>📍 {incident.address || `${incident.latitude}, ${incident.longitude}`}</div>
          <button
            id="relocate-incident-toggle-btn"
            type="button"
            onClick={() => setIsRelocating(!isRelocating)}
            style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#00f0ff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            {isRelocating ? 'Cancel' : '📍 Relocate GPS'}
          </button>
        </div>

        {isRelocating && (
          <div
            id="relocate-gps-panel"
            style={{
              marginTop: '0.6rem',
              padding: '0.6rem',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '6px',
            }}
          >
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                id="auto-geocode-detail-btn"
                onClick={handleAutoGeocodeAddress}
                disabled={isGeocoding || !incident.address}
                style={{
                  flex: 1,
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  color: '#34d399',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  cursor: isGeocoding || !incident.address ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {isGeocoding ? '🛰️ Resolving...' : '🔍 Auto-Locate from Address'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Latitude"
                value={editLat}
                onChange={(e) => setEditLat(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}
              />
              <input
                type="text"
                placeholder="Longitude"
                value={editLon}
                onChange={(e) => setEditLon(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}
              />
            </div>
            {relocateMsg && (
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginBottom: '0.4rem' }}>
                {relocateMsg}
              </div>
            )}
            <button
              type="button"
              id="save-new-coords-btn"
              onClick={handleSaveLocation}
              disabled={isUpdating}
              style={{
                width: '100%',
                background: '#00f0ff',
                color: '#000',
                fontWeight: 700,
                border: 'none',
                padding: '5px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
              }}
            >
              {isUpdating ? 'Updating Coordinates...' : 'Save & Move Map Marker'}
            </button>
          </div>
        )}
      </div>

      {/* Image if available */}
      {incident.image_path && (
        <img
          src={`${API_HOST}${incident.image_path}`}
          alt={incident.title}
          className="detail-img-preview"
          onError={(e) => {
            // Hide image element if broken
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      )}

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          className={`filter-chip ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
          id="detail-tab-info"
        >
          Details & AI
        </button>
        <button
          className={`filter-chip ${activeTab === 'coordination' ? 'active' : ''}`}
          onClick={() => setActiveTab('coordination')}
          id="detail-tab-coordination"
        >
          Response ({assignments.length})
        </button>
        <button
          className={`filter-chip ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
          id="detail-tab-timeline"
        >
          Timeline ({timeline.length})
        </button>
      </div>

      {/* Tab 1: Info & AI Insights */}
      {activeTab === 'info' && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            {incident.description}
          </p>

          {/* AI Intelligence Box */}
          <div className="ai-insights-box" id="ai-insights-container">
            <div className="ai-box-title">
              <span>🤖</span> AI Intelligence & Explainable Priority
            </div>

            <div style={{ fontSize: '0.78rem', color: '#e2e8f0', marginBottom: '0.4rem' }}>
              <strong>Category Confidence:</strong>{' '}
              {incident.ai_category_suggestion ? (
                <span>
                  Suggested <em>{incident.ai_category_suggestion}</em> ({((incident.ai_category_confidence || 0) * 100).toFixed(0)}%)
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Analyzed via rule engine</span>
              )}
            </div>

            {incident.ai_duplicate_of_id && (
              <div style={{ fontSize: '0.78rem', color: '#f87171', marginBottom: '0.4rem' }}>
                ⚠️ <strong>Possible duplicate of Incident #{incident.ai_duplicate_of_id}</strong> (Similarity: {((incident.ai_duplicate_score || 0) * 100).toFixed(0)}%)
              </div>
            )}

            <div style={{ fontSize: '0.78rem', color: '#e2e8f0', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <strong>Threat Index / Risk Score:</strong>
                <span style={{
                  color: (incident.ai_priority_score || (incident.severity === 'critical' ? 9 : incident.severity === 'high' ? 7 : 5)) >= 8 ? '#ff2a5f' : '#fbbf24',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  fontFamily: 'monospace'
                }}>
                  {incident.ai_priority_score ? `${incident.ai_priority_score}/10` : `${incident.severity.toUpperCase()}`}
                </span>
              </div>

              {/* 10-Segment LED Meter */}
              <div style={{ display: 'flex', gap: '4px', height: '8px', margin: '0.4rem 0' }}>
                {Array.from({ length: 10 }).map((_, idx) => {
                  const score = incident.ai_priority_score || (incident.severity === 'critical' ? 9 : incident.severity === 'high' ? 7 : 5);
                  const isActive = idx < score;
                  let color = 'rgba(255, 255, 255, 0.08)';
                  let glow = 'none';
                  if (isActive) {
                    if (idx >= 7) { color = '#ff2a5f'; glow = '0 0 6px #ff2a5f'; }
                    else if (idx >= 4) { color = '#f59e0b'; glow = '0 0 6px #f59e0b'; }
                    else { color = '#00f0ff'; glow = '0 0 6px #00f0ff'; }
                  }
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        borderRadius: '2px',
                        background: color,
                        boxShadow: glow,
                      }}
                    />
                  );
                })}
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: 1.4 }}>
                {incident.ai_priority_explanation || 'Assessed dynamically based on hazard category, severity, and critical infrastructure proximity.'}
              </p>
            </div>
            
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
              * Note: AI outputs are preliminary decision aids and must be confirmed by human dispatchers.
            </p>
          </div>

          {/* Verification & Action Bar */}
          <div className="detail-action-buttons">
            <button
              id="verify-incident-btn"
              className="btn-verify"
              onClick={handleToggleVerification}
              disabled={isUpdating}
            >
              {incident.is_verified ? '✓ Verified (Click to Revoke)' : 'Mark as Verified'}
            </button>
            <select
              id="change-status-select"
              className="form-select"
              style={{ width: 'auto', flex: 1, fontSize: '0.78rem', padding: '0.4rem' }}
              value={incident.status}
              onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
              disabled={isUpdating}
            >
              <option value="reported">Status: Reported</option>
              <option value="verified">Status: Verified</option>
              <option value="responding">Status: Responding</option>
              <option value="resolved">Status: Resolved</option>
              <option value="archived">Status: Archived</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab 2: Response & Assignments */}
      {activeTab === 'coordination' && (
        <div>
          <h4 style={{ fontSize: '0.85rem', marginBottom: '0.6rem' }}>Assigned Units</h4>
          {assignments.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              No responder units deployed yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {assignments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    borderLeft: '3px solid #38bdf8',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Team #{a.team_id} — {a.status.toUpperCase()}
                  </div>
                  {a.notes && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '2px' }}>
                      Notes: {a.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <h4 style={{ fontSize: '0.85rem', marginBottom: '0.6rem' }}>Deploy Unit</h4>
          <form onSubmit={handleAssignTeam}>
            <select
              id="select-responder-team"
              className="form-select"
              style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              required
            >
              <option value="">Select available responder unit...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type.replace('_', ' ')}) — {t.status}
                </option>
              ))}
            </select>
            <input
              id="assignment-notes-input"
              className="form-input"
              type="text"
              placeholder="Instructions / deployment notes"
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}
            />
            <button
              type="submit"
              id="deploy-team-btn"
              className="btn-assign"
              style={{ width: '100%' }}
              disabled={!selectedTeamId || isUpdating}
            >
              Dispatch Unit to Incident
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Timeline Audit Trail */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {timeline.map((event) => (
            <div
              key={event.id}
              style={{
                borderLeft: '2px solid rgba(255, 255, 255, 0.15)',
                paddingLeft: '0.75rem',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {event.event_type.replace('_', ' ')}
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                {event.description}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '2px' }}>
                {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • by {event.created_by}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
