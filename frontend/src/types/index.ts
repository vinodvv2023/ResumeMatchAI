export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  threshold: number;
  created_at: string;
  magic_link?: string;
  token?: string;
  latest_score?: number;
}

export interface TokenInfo {
  job_title: string;
  job_description: string;
  job_id: string;
  valid: boolean;
  expired: boolean;
  revoked: boolean;
}

export interface MatchResult {
  match_id: string;
  score: number;
  passed: boolean;
  matched_skills: string[];
  missing_skills: string[];
  summary: string;
  extracted_data?: {
    name?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    portfolio?: string;
  };
}

export interface Application {
  id: string;
  match_id: string;
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  cover_letter?: string;
  submitted_at: string;
}

export interface RegistryEntry {
  id: string;
  job_title: string;
  candidate_name: string;
  email?: string;
  score: number;
  passed: boolean;
  created_at: string;
  match_id: string;
  has_applied: boolean;
  resume_text?: string;
  cover_letter?: string;
  resume_id?: string;
  filename?: string;
  magic_link?: string;
}
