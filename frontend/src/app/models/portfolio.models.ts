// ========================================
// DATA MODELS
// ========================================

export interface SocialLink {
  id?: number;
  platform: string;
  url: string;
  icon?: string;
  order: number;
}

export interface About {
  id?: number;
  overview: string;
  profile_image?: string;
}

export interface Skill {
  id?: number;
  name: string;
  category?: string;
  icon?: string;
  order: number;
}

export interface Service {
  id?: number;
  title: string;
  description: string;
  icon?: string;
  order: number;
}

export interface Certification {
  id?: number;
  name: string;
  issuer?: string;
  badge_image?: string;
  cert_image?: string;
  issued_date?: string;
  order: number;
}

export interface ExperienceSkill {
  id?: number;
  skill_name: string;
  explanation: string;
  order: number;
}

export interface WorkExperience {
  id?: number;
  company: string;
  role: string;
  start_date: string;
  end_date?: string;
  summary?: string;
  order: number;
  skills_acquired?: ExperienceSkill[];
}

export interface Project {
  id?: number;
  name: string;
  description: string;
  image?: string;
  live_url?: string;
  github_url?: string;
  technologies?: string;
  order: number;
}

export interface KPI {
  id?: number;
  title: string;
  description: string;
  status: 'Planned' | 'In Progress' | 'Completed';
  target_date?: string;
  visibility: 'Public' | 'Coming Soon';
  order: number;
}

export interface Contact {
  id?: number;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  location?: string;
  cv_url?: string;
}

export interface AuthResponse {
  token: string;
  message: string;
}

export interface UploadResponse {
  url: string;
}
