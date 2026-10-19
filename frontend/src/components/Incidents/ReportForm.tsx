/**
 * Project JEEVAN — Incident Report Form Modal
 * Allows citizens and operators to submit new emergency reports with GPS and photo evidence.
 */

import React, { useState } from 'react';
import { api, API_HOST } from '../../api/client';
import type { HazardCategory, SeverityLevel, Incident } from '../../types/incident';

interface ReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentCreated: (incident: Incident) => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  isOpen,
  onClose,
  onIncidentCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HazardCategory>('flood');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [address, setAddress] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle photo selection & upload preview
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));

      try {
        const uploadRes = await api.uploadImage(file);
        setUploadedPath(uploadRes.image_path);
      } catch (err) {
        console.error('Image upload failed', err);
        setErrorMsg('Failed to upload image evidence. You can still submit without it.');
      }
    }
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
        },
        (err) => {
          setErrorMsg(`Unable to get location: ${err.message}`);
        }
      );
    } else {
      setErrorMsg('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum)) {
      setErrorMsg('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    if (description.trim().length < 10) {
      setErrorMsg('Description must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newIncident = await api.createIncident({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        latitude: latNum,
        longitude: lonNum,
        address: address.trim(),
        image_path: uploadedPath,
        reporter_name: reporterName.trim() || 'Anonymous',
        reporter_contact: reporterContact.trim() || undefined,
        source: 'citizen',
      });

      onIncidentCreated(newIncident);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Submission failed';
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" id="report-modal-overlay">
      <div className="report-modal" id="incident-report-modal">
        <div className="modal-header">
          <div>
            <h2>Report Emergency Incident</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Submit verified or observed hazard intelligence to active responders.
            </p>
          </div>
          <button
            id="close-report-modal-btn"
            className="detail-close-btn"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div
            id="report-form-error-banner"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} id="incident-report-form">
          <div className="form-group">
            <label className="form-label" htmlFor="incident-title-input">
              Incident Headline *
            </label>
            <input
              id="incident-title-input"
              className="form-input"
              type="text"
              required
              minLength={3}
              placeholder="e.g., Waterlogging submerged vehicles near underpass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="incident-category-select">
                Hazard Category *
              </label>
              <select
                id="incident-category-select"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as HazardCategory)}
              >
                <option value="flood">🌊 Flooding & Urban Waterlogging</option>
                <option value="fire">🔥 Fires & Smoke Reports</option>
                <option value="severe_weather">🌪️ Severe Weather & Blocked Roads</option>
                <option value="road_accident">🚗 Road Accidents</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="incident-severity-select">
                Estimated Severity *
              </label>
              <select
                id="incident-severity-select"
                className="form-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              >
                <option value="low">Low — Minor disruption</option>
                <option value="medium">Medium — Localized impact</option>
                <option value="high">High — Significant damage/trapped</option>
                <option value="critical">Critical — Immediate life danger</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="incident-description-textarea">
              Detailed Description *
            </label>
            <textarea
              id="incident-description-textarea"
              className="form-textarea"
              rows={3}
              required
              minLength={10}
              placeholder="Describe what happened, water depth, number of persons affected, road obstructions, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Location Coordinates & Address */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Location Coordinates *
              </label>
              <button
                type="button"
                id="use-gps-btn"
                onClick={handleGetLocation}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-accent)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                📍 Use Device GPS
              </button>
            </div>
            <div className="form-row">
              <input
                id="incident-latitude-input"
                className="form-input"
                type="text"
                placeholder="Latitude (e.g. 28.6139)"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
              <input
                id="incident-longitude-input"
                className="form-input"
                type="text"
                placeholder="Longitude (e.g. 77.2090)"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="incident-address-input">
              Landmark / Street Address
            </label>
            <input
              id="incident-address-input"
              className="form-input"
              type="text"
              placeholder="e.g. Outer Ring Road near Moti Bagh Flyover"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Image Upload Evidence */}
          <div className="form-group">
            <label className="form-label">Photo Evidence (Optional)</label>
            <label className="file-dropzone" htmlFor="incident-file-input">
              <input
                id="incident-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <div>
                  <img
                    src={imagePreview}
                    alt="Uploaded evidence"
                    style={{ maxHeight: '140px', borderRadius: '8px' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-accent)', marginTop: '0.4rem' }}>
                    Click to change photo
                  </p>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '1.5rem' }}>📷</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Click to attach photo or drag file here
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    JPG, PNG, WebP supported
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Optional Reporter Info */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="incident-reporter-name-input">
                Your Name (Optional)
              </label>
              <input
                id="incident-reporter-name-input"
                className="form-input"
                type="text"
                placeholder="Anonymous"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="incident-reporter-contact-input">
                Phone / Contact (Optional)
              </label>
              <input
                id="incident-reporter-contact-input"
                className="form-input"
                type="text"
                placeholder="+91-XXXXX-XXXXX"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
              />
            </div>
          </div>

          <div className="form-submit-row">
            <button
              type="button"
              id="cancel-report-btn"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-report-btn"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Transmitting Report...' : 'Submit Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
