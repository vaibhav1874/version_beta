/**
 * Project JEEVAN — Shared TypeScript Types
 */

export type HazardCategory = 'flood' | 'fire' | 'severe_weather' | 'road_accident';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 
  | 'reported' 
  | 'verified' 
  | 'responding' 
  | 'resolved' 
  | 'duplicate' 
  | 'archived';

export type IncidentSource = 'citizen' | 'sensor' | 'simulation';

export interface Incident {
  id: number;
  title: string;
  description: string;
  category: HazardCategory;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  address: string;
  image_path?: string | null;
  status: IncidentStatus;
  source: IncidentSource;
  
  // AI Suggestions (strictly non-authoritative suggestions)
  ai_category_suggestion?: string | null;
  ai_category_confidence?: number | null;
  ai_duplicate_of_id?: number | null;
  ai_duplicate_score?: number | null;
  ai_priority_explanation?: string | null;
  ai_priority_score?: number | null;
  priority_score?: number | null;
  
  is_verified: boolean;
  reporter_name: string;
  reporter_contact?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreatePayload {
  title: string;
  description: string;
  category: HazardCategory;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  address: string;
  image_path?: string | null;
  source?: IncidentSource;
  reporter_name?: string;
  reporter_contact?: string;
}

export interface ResponderTeam {
  id: number;
  name: string;
  type: 'fire_brigade' | 'medical' | 'police' | 'municipal' | 'rescue';
  status: 'available' | 'deployed' | 'off_duty';
  contact?: string | null;
  created_at: string;
}

export interface Assignment {
  id: number;
  incident_id: number;
  team_id: number;
  status: 'assigned' | 'en_route' | 'on_scene' | 'completed';
  notes?: string | null;
  assigned_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: number;
  incident_id: number;
  event_type: 'created' | 'verified' | 'assigned' | 'status_change' | 'resolved' | 'note';
  description: string;
  created_by: string;
  created_at: string;
}
