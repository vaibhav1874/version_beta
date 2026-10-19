/**
 * Project JEEVAN — Leaflet Map Dashboard
 * Interactive multi-hazard emergency map with custom categorized markers.
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

// Helper to create category-specific styled DivIcon
const createCustomMarker = (category: HazardCategory, isSelected: boolean) => {
  const iconEmoji: Record<HazardCategory, string> = {
    flood: '🌊',
    fire: '🔥',
    severe_weather: '🌪️',
    road_accident: '🚗',
  };

  const emoji = iconEmoji[category] || '⚠️';
  const size = isSelected ? 42 : 32;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isSelected ? '22px' : '16px'};
        border-radius: 50%;
        background: ${isSelected ? 'rgba(56, 189, 248, 0.9)' : 'rgba(15, 23, 42, 0.85)'};
        border: 2px solid ${isSelected ? '#38bdf8' : '#ffffff'};
        box-shadow: 0 0 ${isSelected ? '16px rgba(56, 189, 248, 0.8)' : '8px rgba(0,0,0,0.5)'};
        transition: all 0.25s ease;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Component to smoothly pan the map when an incident is selected
function MapFlyTo({ selectedIncident }: { selectedIncident: Incident | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedIncident) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 14, {
        duration: 1.2,
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
  // Default center: Delhi NCR (standard urban center) or fallback to first incident
  const defaultCenter: [number, number] = incidents.length > 0
    ? [incidents[0].latitude, incidents[0].longitude]
    : [28.6139, 77.2090];

  return (
    <div className="map-pane" id="incident-map-container">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* OpenStreetMap standard tiles (Free, zero API key) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFlyTo selectedIncident={selectedIncident} />

        {incidents.map((incident) => {
          const isSelected = selectedIncident?.id === incident.id;
          return (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={createCustomMarker(incident.category, isSelected)}
              eventHandlers={{
                click: () => onSelectIncident(incident),
              }}
            >
              <Popup>
                <div style={{ color: '#0f172a', minWidth: '180px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                    {incident.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '6px' }}>
                    Category: <strong>{incident.category.replace('_', ' ')}</strong> | Status: <strong>{incident.status}</strong>
                  </div>
                  <button
                    id={`popup-view-btn-${incident.id}`}
                    onClick={() => onSelectIncident(incident)}
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    View Details
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
