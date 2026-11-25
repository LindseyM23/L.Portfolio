import * as Models from '../models/portfolio.models';
import snapshot from './fallback-data.json';

/**
 * A built-in copy of the portfolio content, shown when the API / database
 * can't be reached. Images live in src/assets/fallback/media.
 *
 * To refresh it after editing content, re-run the snapshot script:
 *   npm run snapshot
 */
export interface FallbackData {
  socialLinks: Models.SocialLink[];
  about: Models.About;
  skills: Models.Skill[];
  services: Models.Service[];
  certifications: Models.Certification[];
  experience: Models.WorkExperience[];
  projects: Models.Project[];
  kpis: Models.KPI[];
  contact: Models.Contact;
}

export const FALLBACK_DATA = snapshot as unknown as FallbackData;
