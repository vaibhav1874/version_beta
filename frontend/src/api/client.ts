/**
 * Project JEEVAN — API Client
 * Axios-based wrapper for all backend endpoints.
 */

import axios from 'axios';
import type {
  Incident,
  IncidentCreatePayload,
  ResponderTeam,
  Assignment,
  TimelineEvent,
  HazardCategory,
  IncidentStatus,
  SeverityLevel,
} from '../types/incident';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_HOST = BASE_URL.startsWith('http')
  ? BASE_URL.replace(/\/api\/?$/, '')
  : '';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface IncidentFilters {
  category?: HazardCategory;
  status?: IncidentStatus;
  severity?: SeverityLevel;
  is_verified?: boolean;
  source?: string;
  limit?: number;
  offset?: number;
}

export const api = {
  // Incidents
  getIncidents: async (filters?: IncidentFilters): Promise<Incident[]> => {
    const { data } = await apiClient.get<Incident[]>('/incidents', { params: filters });
    return data;
  },

  getIncident: async (id: number): Promise<Incident> => {
    const { data } = await apiClient.get<Incident>(`/incidents/${id}`);
    return data;
  },

  createIncident: async (payload: IncidentCreatePayload): Promise<Incident> => {
    const { data } = await apiClient.post<Incident>('/incidents', payload);
    return data;
  },

  updateIncident: async (id: number, payload: Partial<Incident>): Promise<Incident> => {
    const { data } = await apiClient.patch<Incident>(`/incidents/${id}`, payload);
    return data;
  },

  archiveIncident: async (id: number): Promise<{ message: string; id: number }> => {
    const { data } = await apiClient.delete(`/incidents/${id}`);
    return data;
  },

  uploadImage: async (file: File): Promise<{ filename: string; image_path: string; size_bytes: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/incidents/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Responders
  getResponders: async (params?: { type?: string; status?: string }): Promise<ResponderTeam[]> => {
    const { data } = await apiClient.get<ResponderTeam[]>('/responders', { params });
    return data;
  },

  createResponder: async (payload: Omit<ResponderTeam, 'id' | 'created_at'>): Promise<ResponderTeam> => {
    const { data } = await apiClient.post<ResponderTeam>('/responders', payload);
    return data;
  },

  assignTeam: async (incidentId: number, teamId: number, notes?: string): Promise<Assignment> => {
    const { data } = await apiClient.post<Assignment>(`/incidents/${incidentId}/assign`, {
      team_id: teamId,
      notes,
    });
    return data;
  },

  getAssignments: async (incidentId: number): Promise<Assignment[]> => {
    const { data } = await apiClient.get<Assignment[]>(`/incidents/${incidentId}/assignments`);
    return data;
  },

  getTimeline: async (incidentId: number): Promise<TimelineEvent[]> => {
    const { data } = await apiClient.get<TimelineEvent[]>(`/incidents/${incidentId}/timeline`);
    return data;
  },

  addTimelineNote: async (incidentId: number, description: string, createdBy = 'coordinator'): Promise<TimelineEvent> => {
    const { data } = await apiClient.post<TimelineEvent>(`/incidents/${incidentId}/timeline`, {
      event_type: 'note',
      description,
      created_by: createdBy,
    });
    return data;
  },

  // AI Intelligence Services
  classifyImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{
      suggested_category: string | null;
      confidence: number | null;
      is_confident: boolean;
      disclaimer: string;
    }>('/ai/classify-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  checkDuplicates: async (params: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    category: string;
  }) => {
    const { data } = await apiClient.post<{
      is_duplicate: boolean;
      duplicate_of_id: number | null;
      similarity_score: number | null;
      message: string;
    }>('/ai/check-duplicates', params);
    return data;
  },

  assessPriority: async (params: {
    category: string;
    description: string;
    reported_severity?: string;
    has_image?: boolean;
    is_verified?: boolean;
  }) => {
    const { data } = await apiClient.post<{
      priority_score: number;
      severity: string;
      explanation: string;
    }>('/ai/assess-priority', params);
    return data;
  },

  checkHealth: async () => {
    const { data } = await apiClient.get('/health');
    return data;
  },
};

