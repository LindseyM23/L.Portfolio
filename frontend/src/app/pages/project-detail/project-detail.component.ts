import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PortfolioService } from '../../services/portfolio.service';
import { Project } from '../../models/portfolio.models';
import { ToastService } from '../../services/toast.service';
import { SlideshowComponent } from '../../shared/slideshow.component';
import { ImageManagerComponent } from '../../shared/image-manager.component';
import { ModalComponent } from '../../shared/modal.component';

interface Block {
  heading: boolean;
  text: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SlideshowComponent, ImageManagerComponent, ModalComponent],
  template: `
    <div class="detail-page" *ngIf="project">
      <div class="hero-band dark">
        <div class="container">
          <a routerLink="/" fragment="portfolio" class="back-link mono">&larr; Back to portfolio</a>
          <p class="mono kicker">Project {{ (position + 1).toString().padStart(2, '0') }} / {{ allProjects.length.toString().padStart(2, '0') }}</p>
          <h1>{{ project.name }}</h1>
          <div class="links">
            <a *ngIf="project.live_url" [href]="project.live_url" target="_blank" rel="noopener" class="link-btn">Live site <span>&#x2197;</span></a>
            <a *ngIf="project.github_url" [href]="project.github_url" target="_blank" rel="noopener" class="link-btn ghost">Source <span>&#x2197;</span></a>
          </div>
        </div>
      </div>

      <div class="container body">
        <div class="stage">
          <app-slideshow [images]="project.images || []" [alt]="project.name" [interval]="5000">
            <div class="stage-placeholder">
              <span class="initials">{{ initials(project.name) }}</span>
              <span class="mono">Images coming soon</span>
            </div>
          </app-slideshow>
        </div>

        <div *ngIf="isAdmin" class="admin-actions">
          <button (click)="editingImages = true">Manage images</button>
        </div>

        <div class="content-grid">
          <aside>
            <span class="mono label">(01) The project</span>
            <div *ngIf="tech.length" class="tech">
              <span class="mono label">Built with</span>
              <ul><li *ngFor="let t of tech" class="mono">{{ t }}</li></ul>
            </div>
          </aside>

          <article class="write-up">
            <ng-container *ngFor="let block of blocks; let first = first">
              <h3 *ngIf="block.heading" class="mono">{{ block.text }}</h3>
              <p *ngIf="!block.heading" [class.lead]="first">{{ block.text }}</p>
            </ng-container>
          </article>
        </div>

        <app-modal [open]="editingImages" title="Manage images" [kicker]="project.name" [wide]="true" (closed)="cancelImages()">
          <app-image-manager [(images)]="draftImages"></app-image-manager>
          <ng-container modal-actions><button (click)="saveImages()">Save images</button></ng-container>
        </app-modal>

        <a *ngIf="nextProject" class="next" [routerLink]="['/projects', nextProject.id]">
          <span class="mono label">Next project</span>
          <span class="next-name">{{ nextProject.name }} <span class="arrow">&#x2192;</span></span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../theme.scss';
    .detail-page { min-height: 100vh; }
    .hero-band .container { padding-top: $spacing-xl; padding-bottom: clamp(3rem, 7vw, 5rem); }
    .back-link { display: inline-block; margin-bottom: clamp(3rem, 8vw, 6rem); }
    .back-link:hover { text-decoration: underline; text-underline-offset: 4px; }
    .kicker { color: var(--muted); margin-bottom: $spacing-md; }
    h1 {
      font-size: clamp(3rem, 9vw, 7.5rem);
      line-height: 0.9;
      text-transform: uppercase;
      letter-spacing: -0.04em;
      margin-bottom: $spacing-lg;
    }
    .links { display: flex; flex-wrap: wrap; gap: $spacing-xs; }
    .link-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 22px; border: 1px solid var(--fg); border-radius: $pill;
      background: var(--fg); color: var(--bg); font-size: 14px; font-weight: 600;
      transition: background $transition-fast, color $transition-fast;
    }
    .link-btn:hover, .link-btn.ghost { background: transparent; color: var(--fg); }
    .link-btn.ghost:hover { background: var(--fg); color: var(--bg); }

    .body { padding-top: clamp(2rem, 5vw, 4rem); }
    .stage {
      position: relative;
      aspect-ratio: 16 / 9;
      border-radius: $border-radius;
      overflow: hidden;
      background: $black;
    }
    .stage-placeholder {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $spacing-sm;
      color: rgba(250, 250, 247, 0.6);
      background: repeating-linear-gradient(-45deg, transparent 0 22px, rgba(250, 250, 247, 0.06) 22px 23px), $black;
    }
    .initials {
      font-family: $font-display; font-size: clamp(6rem, 20vw, 16rem); font-weight: 800;
      line-height: 0.9; letter-spacing: -0.06em; color: transparent; -webkit-text-stroke: 1.5px $white;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 2.4fr;
      gap: $spacing-xl;
      margin-top: clamp(3rem, 7vw, 5rem);
      padding-top: $spacing-lg;
      border-top: 1px solid var(--line);
    }
    .label { color: var(--muted); display: block; }
    .tech { margin-top: $spacing-lg; }
    .tech ul { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin-top: $spacing-xs; }
    .tech li { font-size: 10px; padding: 5px 10px; border: 1px solid var(--line); border-radius: $pill; }
    .write-up { max-width: 68ch; }
    .write-up p { color: var(--muted); line-height: 1.8; margin-bottom: $spacing-md; white-space: pre-line; }
    .write-up p.lead {
      font-family: $font-display; font-size: clamp(1.3rem, 2.2vw, 1.75rem); font-weight: 600;
      line-height: 1.3; color: var(--fg); margin-bottom: $spacing-lg;
    }
    .write-up h3 { font-size: 12px; margin: $spacing-lg 0 $spacing-sm; padding-top: $spacing-sm; border-top: 1px solid var(--line); }

    .next {
      display: block;
      margin-top: clamp(4rem, 9vw, 7rem);
      padding: $spacing-lg 0;
      border-top: 1px solid var(--fg);
    }
    .next-name {
      display: block; margin-top: $spacing-xs;
      font-family: $font-display; font-size: clamp(2.25rem, 6vw, 5rem); font-weight: 800;
      line-height: 1; letter-spacing: -0.04em; text-transform: uppercase;
      transition: transform $transition-normal;
    }
    .next .arrow { display: inline-block; transition: transform $transition-normal; }
    .next:hover .next-name { transform: translateX(12px); }
    .next:hover .arrow { transform: translateX(12px); }
    @media (max-width: $bp-mobile) {
      .content-grid { grid-template-columns: 1fr; gap: $spacing-md; }
      .stage { aspect-ratio: 4 / 3; }
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  isAdmin = false;
  project: Project | null = null;
  allProjects: Project[] = [];
  blocks: Block[] = [];
  tech: string[] = [];
  editingImages = false;
  draftImages: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private portfolioService: PortfolioService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
    this.portfolioService.getProjects().subscribe(projects => this.allProjects = projects);
    // Re-load when navigating project → next project
    this.route.paramMap.subscribe(params => this.loadProject(Number(params.get('id'))));
  }

  get position(): number {
    return Math.max(0, this.allProjects.findIndex(p => p.id === this.project?.id));
  }

  get nextProject(): Project | null {
    if (this.allProjects.length < 2) return null;
    return this.allProjects[(this.position + 1) % this.allProjects.length];
  }

  loadProject(id: number): void {
    this.editingImages = false;
    this.portfolioService.getProject(id).subscribe(project => {
      this.project = project;
      this.draftImages = [...(project.images ?? [])];
      this.blocks = this.toBlocks(project.description);
      this.tech = (project.technologies ?? '').split(',').map(t => t.trim()).filter(Boolean);
    });
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  // Split the description on blank lines; short single lines without
  // closing punctuation (e.g. "About the project") become subheadings.
  private toBlocks(description: string): Block[] {
    return description
      .split(/\n\s*\n/)
      .map(chunk => chunk.trim())
      .filter(Boolean)
      .map(text => ({
        text,
        heading: !text.includes('\n') && text.length <= 40 && !/[.!?:]$/.test(text)
      }));
  }

  cancelImages(): void {
    this.editingImages = false;
    this.draftImages = [...(this.project?.images ?? [])];
  }

  saveImages(): void {
    if (!this.project?.id) return;
    const update = { ...this.project, images: this.draftImages, image: this.draftImages[0] ?? '' };
    this.portfolioService.updateProject(this.project.id, update).subscribe({
      next: () => {
        this.loadProject(this.project!.id!);
        this.toast.success('Images saved');
      },
      error: err => this.toast.apiError(err, 'Could not save images')
    });
  }
}
