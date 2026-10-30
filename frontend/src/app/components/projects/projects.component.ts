import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Project } from '../../models/portfolio.models';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { ModalComponent } from '../../shared/modal.component';
import { SlideshowComponent } from '../../shared/slideshow.component';
import { ImageManagerComponent } from '../../shared/image-manager.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective, SlideshowComponent, ImageManagerComponent, ModalComponent],
  template: `
    <section class="projects-section">
      <div class="container">
        <header class="section-head" appReveal>
          <span class="section-index">(05)</span>
          <h2 class="section-title">Selected <em>work</em></h2>
          <p class="section-kicker">Products and platforms I've designed, built and shipped.</p>
        </header>

        <div class="projects-list">
          <article *ngFor="let project of projects; let i = index" class="project" appReveal>
            <ng-container>
              <div class="visual" (click)="viewDetails(project.id!)">
                <app-slideshow [images]="project.images || []" [alt]="project.name">
                  <div class="visual-placeholder">
                    <span class="initials">{{ initials(project.name) }}</span>
                  </div>
                </app-slideshow>
                <span class="visual-num mono">{{ (i + 1).toString().padStart(2, '0') }} / {{ projects.length.toString().padStart(2, '0') }}</span>
              </div>

              <div class="content">
                <span class="mono kicker">Project {{ (i + 1).toString().padStart(2, '0') }}</span>
                <h3>{{ project.name }}</h3>
                <p class="desc">{{ excerpt(project.description) }}</p>

                <div *ngIf="project.technologies" class="tech">
                  <span *ngFor="let t of splitTech(project.technologies)" class="mono">{{ t }}</span>
                </div>

                <div class="links">
                  <button class="read-more" (click)="viewDetails(project.id!)">Read more &#x2192;</button>
                  <a *ngIf="project.live_url" [href]="project.live_url" target="_blank" rel="noopener" class="link-btn ghost">Live site <span>&#x2197;</span></a>
                  <a *ngIf="project.github_url" [href]="project.github_url" target="_blank" rel="noopener" class="link-btn ghost">Source <span>&#x2197;</span></a>
                </div>

                <div *ngIf="isAdmin" class="admin-actions">
                  <button (click)="startEditProject(project)">Edit</button>
                  <button class="btn-ghost" (click)="deleteProject(project.id!)">Delete</button>
                </div>
              </div>
            </ng-container>
          </article>
        </div>

        <div *ngIf="isAdmin" class="add-tile" (click)="adding = true">+ Add project</div>
      </div>
    </section>

    <app-modal [open]="editingProject !== null" title="Edit project" kicker="Selected work" [wide]="true" (closed)="cancelEditProject()">
      <label class="field"><span>Name</span><input [(ngModel)]="editProjectData.name" /></label>
      <label class="field"><span>Description</span><textarea [(ngModel)]="editProjectData.description" rows="8"></textarea><small class="hint">Separate paragraphs with a blank line. Short lines on their own become subheadings.</small></label>
      <app-image-manager [(images)]="editProjectData.images!"></app-image-manager>
      <label class="field"><span>Technologies</span><input [(ngModel)]="editProjectData.technologies" placeholder="Comma-separated, e.g. Angular, AWS, Python" /></label>
      <div class="field-row">
        <label class="field"><span>Live URL</span><input [(ngModel)]="editProjectData.live_url" /></label>
        <label class="field"><span>GitHub URL</span><input [(ngModel)]="editProjectData.github_url" /></label>
      </div>
      <ng-container modal-actions><button (click)="saveEditProject()">Save changes</button></ng-container>
    </app-modal>

    <app-modal [open]="adding" title="Add project" kicker="Selected work" [wide]="true" (closed)="cancelAdd()">
      <label class="field"><span>Name</span><input [(ngModel)]="newProject.name" /></label>
      <label class="field"><span>Description</span><textarea [(ngModel)]="newProject.description" rows="8"></textarea><small class="hint">Separate paragraphs with a blank line. Short lines on their own become subheadings.</small></label>
      <app-image-manager [(images)]="newProject.images!"></app-image-manager>
      <label class="field"><span>Technologies</span><input [(ngModel)]="newProject.technologies" placeholder="Comma-separated, e.g. Angular, AWS, Python" /></label>
      <div class="field-row">
        <label class="field"><span>Live URL</span><input [(ngModel)]="newProject.live_url" /></label>
        <label class="field"><span>GitHub URL</span><input [(ngModel)]="newProject.github_url" /></label>
      </div>
      <ng-container modal-actions><button (click)="addProject()">Add project</button></ng-container>
    </app-modal>
  `,
  styles: [`
    @import '../../../theme.scss';
    :host { display: block; }
    .projects-list { display: flex; flex-direction: column; gap: clamp(4rem, 8vw, 7rem); }
    .project {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: clamp(2rem, 5vw, 5rem);
      align-items: center;
    }
    .project:nth-child(even) .visual { order: 2; }

    .visual {
      position: relative;
      aspect-ratio: 4 / 3;
      border-radius: $border-radius;
      overflow: hidden;
      background: $black;
    }
    .visual { cursor: pointer; }
    .visual-placeholder {
      position: absolute;
      inset: 0;
      @include flex-center;
      background:
        repeating-linear-gradient(-45deg, transparent 0 22px, rgba(250, 250, 247, 0.06) 22px 23px),
        $black;
      transition: background-position $transition-slow;
    }
    .initials {
      font-family: $font-display;
      font-size: clamp(6rem, 16vw, 13rem);
      font-weight: 800;
      letter-spacing: -0.06em;
      color: transparent;
      -webkit-text-stroke: 1.5px $white;
      transition: color $transition-slow, transform $transition-slow;
    }
    .project:hover .initials { color: $white; transform: scale(1.06) rotate(-3deg); }
    .visual-num {
      position: absolute;
      left: 18px;
      bottom: 16px;
      font-size: 10px;
      color: $white;
      mix-blend-mode: difference;
    }

    .kicker { color: var(--muted); display: block; margin-bottom: $spacing-sm; }
    .content h3 {
      font-size: clamp(2rem, 4.5vw, 3.75rem);
      text-transform: uppercase;
      line-height: 0.95;
      margin-bottom: $spacing-md;
    }
    .desc {
      color: var(--muted);
      line-height: 1.7;
      margin-bottom: $spacing-md;
      max-width: 56ch;
    }
    .tech { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: $spacing-md; }
    .tech span { font-size: 10px; padding: 5px 10px; border: 1px solid var(--line); border-radius: $pill; }
    .links { display: flex; flex-wrap: wrap; gap: $spacing-xs; }
    .read-more { padding: 12px 22px; }
    .link-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 22px;
      border: 1px solid var(--fg);
      border-radius: $pill;
      background: var(--fg);
      color: var(--bg);
      font-size: 14px;
      font-weight: 600;
      transition: background $transition-fast, color $transition-fast;
    }
    .link-btn span { transition: transform $transition-fast; }
    .link-btn:hover span { transform: rotate(45deg); }
    .link-btn:hover, .link-btn.ghost { background: transparent; color: var(--fg); }
    .link-btn.ghost:hover { background: var(--fg); color: var(--bg); }
    .add-tile { margin-top: $spacing-xl; min-height: 100px; }

    @media (max-width: $bp-mobile) {
      .project { grid-template-columns: 1fr; }
      .project:nth-child(even) .visual { order: 0; }
    }
  `]
})
export class ProjectsComponent implements OnInit {
  isAdmin = false;
  projects: Project[] = [];
  adding = false;
  editingProject: number | null = null;
  newProject: Project = { name: '', description: '', images: [], order: 0 };
  editProjectData: Project = { name: '', description: '', images: [], order: 0 };

  constructor(
    private portfolioService: PortfolioService,
    private router: Router,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadProjects(): void {
    this.portfolioService.getProjects().subscribe(projects => this.projects = projects);
  }

  viewDetails(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  // First paragraph only, trimmed — the full write-up lives on the detail page
  excerpt(description: string): string {
    const first = description.split(/\n\s*\n/).map(c => c.trim()).find(Boolean) ?? '';
    const text = first.replace(/\s*\n\s*/g, ' · ');
    return text.length > 220 ? text.slice(0, 220).trimEnd() + '…' : text;
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  splitTech(technologies: string): string[] {
    return technologies.split(',').map(t => t.trim()).filter(Boolean);
  }

  addProject(): void {
    if (!this.toast.require({ Name: this.newProject.name, Description: this.newProject.description })) return;
    this.newProject.image = this.newProject.images?.[0];
    this.portfolioService.createProject(this.newProject).subscribe({
      next: () => {
        this.loadProjects();
        this.cancelAdd();
        this.toast.success('Project added');
      },
      error: err => this.toast.apiError(err, 'Could not add project')
    });
  }

  cancelAdd(): void {
    this.adding = false;
    this.newProject = { name: '', description: '', images: [], order: 0 };
  }

  startEditProject(project: Project): void {
    this.editingProject = project.id!;
    this.editProjectData = { ...project, images: [...(project.images ?? [])] };
  }

  saveEditProject(): void {
    if (!this.editingProject || !this.toast.require({ Name: this.editProjectData.name, Description: this.editProjectData.description })) return;
    this.editProjectData.image = this.editProjectData.images?.[0] ?? '';
    this.portfolioService.updateProject(this.editingProject, this.editProjectData).subscribe({
      next: () => {
        this.loadProjects();
        this.cancelEditProject();
        this.toast.success('Project updated');
      },
      error: err => this.toast.apiError(err, 'Could not update project')
    });
  }

  cancelEditProject(): void {
    this.editingProject = null;
    this.editProjectData = { name: '', description: '', images: [], order: 0 };
  }

  async deleteProject(id: number): Promise<void> {
    if (!(await this.confirm.delete('project', this.projects.find(pr => pr.id === id)?.name))) return;
    this.portfolioService.deleteProject(id).subscribe({
      next: () => {
        this.loadProjects();
        this.toast.success('Project deleted');
      },
      error: err => this.toast.apiError(err, 'Could not delete project')
    });
  }
}
