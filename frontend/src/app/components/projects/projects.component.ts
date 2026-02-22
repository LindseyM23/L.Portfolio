import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Project } from '../../models/portfolio.models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="projects-section">
      <div class="container">
        <h2 class="section-title">Portfolio Projects</h2>
        
        <div class="projects-grid">
          <div *ngFor="let project of projects" class="project-card">
            <div *ngIf="editingProject !== project.id">
              <div class="project-image">
                <img *ngIf="project.image" [src]="project.image" [alt]="project.name" />
                <div *ngIf="!project.image" class="image-placeholder">📁</div>
              </div>
              
              <div class="project-content">
                <h3>{{ project.name }}</h3>
                <p>{{ project.description }}</p>
                
                <div class="project-links">
                  <a *ngIf="project.live_url" [href]="project.live_url" target="_blank">🌐 Live</a>
                  <a *ngIf="project.github_url" [href]="project.github_url" target="_blank">💻 GitHub</a>
                </div>
                
                <div *ngIf="isAdmin" class="project-actions">
                  <button (click)="startEditProject(project)">Edit</button>
                  <button (click)="deleteProject(project.id!)">Delete</button>
                </div>
              </div>
            </div>

            <div *ngIf="editingProject === project.id" class="edit-form-inline">
              <h4>Edit Project</h4>
              <input [(ngModel)]="editProjectData.name" placeholder="Project Name" />
              <textarea [(ngModel)]="editProjectData.description" placeholder="Description" rows="4"></textarea>
              <input [(ngModel)]="editProjectData.image" placeholder="Image URL" />
              <input [(ngModel)]="editProjectData.live_url" placeholder="Live URL" />
              <input [(ngModel)]="editProjectData.github_url" placeholder="GitHub URL" />
              <div class="project-actions">
                <button (click)="saveEditProject()">Save</button>
                <button (click)="cancelEditProject()">Cancel</button>
              </div>
            </div>
          </div>

          <div *ngIf="isAdmin && !adding" class="add-project" (click)="adding = true">
            <span>+ Add Project</span>
          </div>
        </div>

        <div *ngIf="adding" class="add-form card">
          <h3>Add Project</h3>
          <input [(ngModel)]="newProject.name" placeholder="Project Name" />
          <textarea [(ngModel)]="newProject.description" placeholder="Description" rows="4"></textarea>
          <input [(ngModel)]="newProject.image" placeholder="Image URL" />
          <input [(ngModel)]="newProject.live_url" placeholder="Live URL" />
          <input [(ngModel)]="newProject.github_url" placeholder="GitHub URL" />
          <button (click)="addProject()">Add</button>
          <button (click)="cancelAdd()">Cancel</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import '../../../theme.scss';
    .projects-section { @include section-container; padding: $spacing-xxl 0; }
    .section-title { text-align: center; margin-bottom: $spacing-xxl; }
    .projects-grid { @include responsive-grid(3); }
    .project-card { @include card-base; overflow: hidden; padding: 0; }
    .project-image { width: 100%; height: 200px; background: #f0f0f0; }
    .project-image img { width: 100%; height: 100%; object-fit: cover; }
    .image-placeholder { @include flex-center; height: 100%; font-size: 4rem; }
    .project-content { padding: $spacing-lg; }
    .project-content h3 { margin-bottom: $spacing-sm; }
    .project-content p { color: $text-secondary; margin-bottom: $spacing-md; line-height: 1.6; }
    .project-links { display: flex; gap: $spacing-sm; margin-bottom: $spacing-md; }
    .project-links a { font-size: 14px; padding: $spacing-xs $spacing-md; border: $border-width solid $border-color; border-radius: $border-radius; }
    .project-links a:hover { background: $button-bg; color: $button-text; border-color: $button-bg; }
    .project-actions button { font-size: 12px; padding: $spacing-xs $spacing-sm; }
    .add-project { @include card-base; @include flex-center; min-height: 300px; cursor: pointer; border: 2px dashed $border-color; }
    .add-project:hover { border-color: $accent-color; }
    .add-form { margin-top: $spacing-lg; max-width: 600px; margin: $spacing-xl auto; display: flex; flex-direction: column; gap: $spacing-sm; }
    .add-form input, .add-form textarea { padding: $spacing-md; border: $border-width solid $border-color; border-radius: $border-radius; font-family: $font-family; }
    .edit-form-inline { padding: $spacing-lg; display: flex; flex-direction: column; gap: $spacing-sm; }
    .edit-form-inline h4 { margin-bottom: $spacing-sm; }
    .edit-form-inline input, .edit-form-inline textarea { padding: $spacing-sm; border: $border-width solid $border-color; border-radius: $border-radius; font-family: $font-family; }
  `]
})
export class ProjectsComponent implements OnInit {
  isAdmin = false;
  projects: Project[] = [];
  adding = false;
  editingProject: number | null = null;
  newProject: Project = { name: '', description: '', order: 0 };
  editProjectData: Project = { name: '', description: '', order: 0 };

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.loadProjects();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadProjects(): void {
    this.portfolioService.getProjects().subscribe(projects => this.projects = projects);
  }

  addProject(): void {
    this.portfolioService.createProject(this.newProject).subscribe(() => {
      this.loadProjects();
      this.cancelAdd();
    });
  }

  cancelAdd(): void {
    this.adding = false;
    this.newProject = { name: '', description: '', order: 0 };
  }

  startEditProject(project: Project): void {
    this.editingProject = project.id!;
    this.editProjectData = { ...project };
  }

  saveEditProject(): void {
    if (this.editingProject && this.editProjectData.name.trim()) {
      this.portfolioService.updateProject(this.editingProject, this.editProjectData).subscribe(() => {
        this.loadProjects();
        this.cancelEditProject();
      });
    }
  }

  cancelEditProject(): void {
    this.editingProject = null;
    this.editProjectData = { name: '', description: '', order: 0 };
  }

  deleteProject(id: number): void {
    if (confirm('Delete this project?')) {
      this.portfolioService.deleteProject(id).subscribe(() => this.loadProjects());
    }
  }
}
