/**
 * Project JEEVAN — Sci-Fi / DataV Tactical Cartography Hub
 * High-contrast dark cyber mapping with glowing pulse rings, threat markers, and radar scanlines.
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Incident, HazardCategory } from '../../types/incident';

interface MapDashboardProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
}

// Category palette configuration matching DataV reference
const CATEGORY_THEMES: Record<HazardCategory, { color: string; glow: string; label: string; icon: string }> = {
  flood: {
    color: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.7)',
    label: 'FLOOD',
    icon: '🌊',
  },
  fire: {
    color: '#ff3344',
    glow: 'rgba(255, 51, 68, 0.8)',
    label: 'FIRE',
    icon: '🔥',
  },
  severe_weather: {
    color: '#ffaa00',
    glow: 'rgba(255, 170, 0, 0.75)',
    label: 'STORM',
    icon: '🌪️',
  },
  road_accident: {
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.75)',
    label: 'CRASH',
    icon: '🚗',
  },
};

// Create futuristic DataV radar cyber marker
const createCyberMarker = (incident: Incident, isSelected: boolean) => {
  const theme = CATEGORY_THEMES[incident.category] || {
    color: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.7)',
    label: 'EVENT',
    icon: '⚠️',
  };

  const riskScore = incident.ai_priority_score || (incident.severity === 'critical' ? 9 : incident.severity === 'high' ? 7 : 5);
  const size = isSelected ? 46 : 38;

  return L.divIcon({
    className: 'cyber-leaflet-marker-wrapper',
    html: `
      <div class="cyber-marker-container ${isSelected ? 'is-selected' : ''}" style="--theme-color: ${theme.color}; --theme-glow: ${theme.glow};">
        <div class="cyber-pulse-ring"></div>
        <div class="cyber-pulse-ring-outer"></div>
        <div class="cyber-core-badge" style="width: ${size}px; height: ${size}px;">
          <span class="cyber-icon">${theme.icon}</span>
          <span class="cyber-risk-badge">${riskScore}</span>
        </div>
        <div class="cyber-marker-label">
          <span>[${theme.label}]</span>
        </div>
      </div>
    `,
    iconSize: [size, size + 20],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 10],
  });
};

function MapFlyTo({ selectedIncident }: { selectedIncident: Incident | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedIncident) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 14, {
        duration: 1.4,
      });
    }
  }, [selectedIncident, map]);
  return null;
}

export const MapDashboard: React.FC<MapDashboardProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  const defaultCenter: [number, number] = incidents.length > 0
    ? [incidents[0].latitude, incidents[0].longitude]
    : [28.6139, 77.2090];

  const activeLat = selectedIncident ? selectedIncident.latitude : (incidents.length > 0 ? incidents[0].latitude : 28.6139);
  const activeLon = selectedIncident ? selectedIncident.longitude : (incidents.length > 0 ? incidents[0].longitude : 77.2090);

  return (
    <div className="map-pane datav-map-wrapper" id="incident-map-container">
      {/* Sci-Fi HUD Crosshairs & Telemetry Overlay */}
      <div className="map-hud-overlay">
        <div className="map-hud-corner corner-tl">
          <span className="hud-label">GEO-GRID: {activeLat.toFixed(4)}° N / {activeLon.toFixed(4)}° E</span>
          <span className="hud-sub">TACTICAL RADAR: ACTIVE</span>
        </div>
        <div className="map-hud-corner corner-tr">
          <span className="hud-metric-pill">
            <span className="radar-blip"></span>
            ACTIVE SECTORS: {incidents.length}
          </span>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* OpenStreetMap Tactical Cyber Tiles (100% Free, Zero API Key Watermark) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          className="tactical-dark-tiles"
        />

        <MapFlyTo selectedIncident={selectedIncident} />

        {incidents.map((incident) => {
          const isSelected = selectedIncident?.id === incident.id;
          const theme = CATEGORY_THEMES[incident.category] || CATEGORY_THEMES.flood;
          const risk = incident.ai_priority_score || (incident.severity === 'critical' ? 9 : incident.severity === 'high' ? 7 : 5);

          return (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={createCyberMarker(incident, isSelected)}
              eventHandlers={{
                click: () => onSelectIncident(incident),
              }}
            >
              <Popup className="cyber-popup">
                <div className="cyber-popup-body">
                  <div className="cyber-popup-header">
                    <span className="popup-category" style={{ color: theme.color }}>
                      {theme.icon} {incident.category.toUpperCase().replace('_', ' ')}
                    </span>
                    <span className="popup-risk-tag" style={{ borderColor: theme.color, color: theme.color }}>
                      RISK {risk}/10
                    </span>
                  </div>

                  <h4 className="popup-title">{incident.title}</h4>
                  <p className="popup-address">📍 {incident.address || `${incident.latitude}, ${incident.longitude}`}</p>
                  
                  <div className="popup-status-row">
                    <span className="popup-provenance-tag">[{incident.source.toUpperCase()}]</span>
                    <span className={`badge-status status-${incident.status}`}>{incident.status}</span>
                  </div>

                  <button
                    id={`popup-view-btn-${incident.id}`}
                    onClick={() => onSelectIncident(incident)}
                    className="popup-inspect-btn"
                  >
                    INSPECT TELEMETRY & DISPATCH »
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
