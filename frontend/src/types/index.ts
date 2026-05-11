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
}

export interface Application {
  id: string;
  match_id: string;
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  submitted_at: string;
}
