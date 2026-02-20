import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import * as Models from '../models/portfolio.models';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'admin_token';
  
  // Admin mode state
  private adminModeSubject = new BehaviorSubject<boolean>(this.hasToken());
  public adminMode$ = this.adminModeSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ========== AUTH ==========
  
  login(password: string): Observable<Models.AuthResponse> {
    return this.http.post<Models.AuthResponse>(`${this.apiUrl}/api/auth/login`, { password })
      .pipe(tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        this.adminModeSubject.next(true);
      }));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.adminModeSubject.next(false);
  }

  isAdmin(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.tokenKey);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ========== FILE UPLOAD ==========
  
  uploadFile(file: File): Observable<Models.UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem(this.tokenKey);
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
    return this.http.post<Models.UploadResponse>(`${this.apiUrl}/api/upload`, formData, { headers });
  }

  // ========== SOCIAL LINKS ==========
  
  getSocialLinks(): Observable<Models.SocialLink[]> {
    return this.http.get<Models.SocialLink[]>(`${this.apiUrl}/api/social-links`);
  }

  createSocialLink(link: Models.SocialLink): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/social-links`, link, { headers: this.getHeaders() });
  }

  updateSocialLink(id: number, link: Models.SocialLink): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/social-links/${id}`, link, { headers: this.getHeaders() });
  }

  deleteSocialLink(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/social-links/${id}`, { headers: this.getHeaders() });
  }

  // ========== ABOUT ==========
  
  getAbout(): Observable<Models.About> {
    return this.http.get<Models.About>(`${this.apiUrl}/api/about`);
  }

  updateAbout(about: Models.About): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/about`, about, { headers: this.getHeaders() });
  }

  // ========== SKILLS ==========
  
  getSkills(): Observable<Models.Skill[]> {
    return this.http.get<Models.Skill[]>(`${this.apiUrl}/api/skills`);
  }

  createSkill(skill: Models.Skill): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/skills`, skill, { headers: this.getHeaders() });
  }

  updateSkill(id: number, skill: Models.Skill): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/skills/${id}`, skill, { headers: this.getHeaders() });
  }

  deleteSkill(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/skills/${id}`, { headers: this.getHeaders() });
  }

  // ========== SERVICES ==========
  
  getServices(): Observable<Models.Service[]> {
    return this.http.get<Models.Service[]>(`${this.apiUrl}/api/services`);
  }

  createService(service: Models.Service): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/services`, service, { headers: this.getHeaders() });
  }

  updateService(id: number, service: Models.Service): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/services/${id}`, service, { headers: this.getHeaders() });
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/services/${id}`, { headers: this.getHeaders() });
  }

  // ========== CERTIFICATIONS ==========
  
  getCertifications(): Observable<Models.Certification[]> {
    return this.http.get<Models.Certification[]>(`${this.apiUrl}/api/certifications`);
  }

  createCertification(cert: Models.Certification): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/certifications`, cert, { headers: this.getHeaders() });
  }

  updateCertification(id: number, cert: Models.Certification): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/certifications/${id}`, cert, { headers: this.getHeaders() });
  }

  deleteCertification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/certifications/${id}`, { headers: this.getHeaders() });
  }

  // ========== WORK EXPERIENCE ==========
  
  getExperience(): Observable<Models.WorkExperience[]> {
    return this.http.get<Models.WorkExperience[]>(`${this.apiUrl}/api/experience`);
  }

  getExperienceDetail(id: number): Observable<Models.WorkExperience> {
    return this.http.get<Models.WorkExperience>(`${this.apiUrl}/api/experience/${id}`);
  }

  createExperience(exp: Models.WorkExperience): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/experience`, exp, { headers: this.getHeaders() });
  }

  updateExperience(id: number, exp: Models.WorkExperience): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/experience/${id}`, exp, { headers: this.getHeaders() });
  }

  deleteExperience(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/experience/${id}`, { headers: this.getHeaders() });
  }

  // ========== EXPERIENCE SKILLS ==========
  
  addExperienceSkill(expId: number, skill: Models.ExperienceSkill): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/experience/${expId}/skills`, skill, { headers: this.getHeaders() });
  }

  updateExperienceSkill(id: number, skill: Models.ExperienceSkill): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/experience-skills/${id}`, skill, { headers: this.getHeaders() });
  }

  deleteExperienceSkill(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/experience-skills/${id}`, { headers: this.getHeaders() });
  }

  // ========== PROJECTS ==========
  
  getProjects(): Observable<Models.Project[]> {
    return this.http.get<Models.Project[]>(`${this.apiUrl}/api/projects`);
  }

  createProject(project: Models.Project): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/projects`, project, { headers: this.getHeaders() });
  }

  updateProject(id: number, project: Models.Project): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/projects/${id}`, project, { headers: this.getHeaders() });
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/projects/${id}`, { headers: this.getHeaders() });
  }

  // ========== KPIs ==========
  
  getKPIs(): Observable<Models.KPI[]> {
    return this.http.get<Models.KPI[]>(`${this.apiUrl}/api/kpis`);
  }

  getAllKPIs(): Observable<Models.KPI[]> {
    return this.http.get<Models.KPI[]>(`${this.apiUrl}/api/kpis/all`, { headers: this.getHeaders() });
  }

  createKPI(kpi: Models.KPI): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/kpis`, kpi, { headers: this.getHeaders() });
  }

  updateKPI(id: number, kpi: Models.KPI): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/kpis/${id}`, kpi, { headers: this.getHeaders() });
  }

  deleteKPI(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/kpis/${id}`, { headers: this.getHeaders() });
  }

  // ========== CONTACT ==========
  
  getContact(): Observable<Models.Contact> {
    return this.http.get<Models.Contact>(`${this.apiUrl}/api/contact`);
  }

  updateContact(contact: Models.Contact): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/contact`, contact, { headers: this.getHeaders() });
  }
}
