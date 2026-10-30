import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PortfolioService } from '../../services/portfolio.service';
import { WorkExperience, ExperienceSkill } from '../../models/portfolio.models';

@Component({
  selector: 'app-experience-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="detail-page">
      <div class="hero-band dark">
        <div class="container">
          <a routerLink="/" fragment="experience" class="back-link mono">&larr; Back to portfolio</a>

          <ng-container *ngIf="experience">
            <p class="mono period">
              {{ formatDate(experience.start_date) }} &mdash; {{ experience.end_date ? formatDate(experience.end_date) : 'Present' }}
            </p>
            <h1>{{ experience.role }}</h1>
            <p class="company"><em>{{ experience.company }}</em></p>
          </ng-container>
        </div>
      </div>

      <div *ngIf="experience" class="container body">
        <div class="summary-grid">
          <span class="mono label">(01) Overview</span>
          <p class="summary">{{ experience.summary }}</p>
        </div>

        <div class="skills-section">
          <div class="summary-grid">
            <span class="mono label">(02) Skills acquired</span>
            <div>
              <p class="hint mono" *ngIf="experience.skills_acquired?.length">Select a skill to read the story behind it</p>
              <div class="skills-grid">
                <button *ngFor="let skill of experience.skills_acquired" class="skill-chip btn-ghost" (click)="showExplanation(skill)">
                  {{ skill.skill_name }}
                  <span *ngIf="isAdmin" class="delete-skill" (click)="deleteSkill(skill.id!); $event.stopPropagation()">✕</span>
                </button>

                <button *ngIf="isAdmin && !addingSkill" class="add-skill-chip btn-ghost" (click)="addingSkill = true">
                  + Add skill
                </button>
              </div>
              <p *ngIf="!experience.skills_acquired?.length && !isAdmin" class="empty">More detail coming soon.</p>
            </div>
          </div>

          <div *ngIf="addingSkill" class="admin-form">
            <h4>Add skill</h4>
            <input [(ngModel)]="newSkill.skill_name" placeholder="Skill Name" />
            <textarea [(ngModel)]="newSkill.explanation" placeholder="What did you do to acquire this skill?" rows="4"></textarea>
            <div class="btn-row">
              <button (click)="addSkill()">Add</button>
              <button class="btn-ghost" (click)="cancelAddSkill()">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="selectedSkill" class="skill-explanation-modal" (click)="selectedSkill = null">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <span class="mono label">Skill</span>
          <h3>{{ selectedSkill.skill_name }}</h3>
          <p>{{ selectedSkill.explanation }}</p>
          <button (click)="selectedSkill = null">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../theme.scss';
    .detail-page { min-height: 100vh; }
    .hero-band .container { padding-top: $spacing-xl; padding-bottom: clamp(3rem, 7vw, 5rem); }
    .back-link { display: inline-block; margin-bottom: clamp(3rem, 8vw, 6rem); }
    .back-link:hover { text-decoration: underline; text-underline-offset: 4px; }
    .period { color: var(--muted); margin-bottom: $spacing-md; }
    h1 {
      font-size: clamp(3rem, 9vw, 7.5rem);
      line-height: 0.9;
      text-transform: uppercase;
      letter-spacing: -0.04em;
      margin-bottom: $spacing-md;
    }
    .company { font-size: clamp(1.5rem, 3vw, 2.5rem); color: var(--muted); }
    .body { padding-top: clamp(3rem, 7vw, 5rem); }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 3fr;
      gap: $spacing-lg;
      padding: $spacing-lg 0;
      border-top: 1px solid var(--line);
    }
    .label { color: var(--muted); }
    .summary { font-family: $font-display; font-size: clamp(1.25rem, 2.2vw, 1.85rem); font-weight: 600; line-height: 1.3; }
    .hint { color: var(--muted); font-size: 10px; margin-bottom: $spacing-sm; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: $spacing-xs; }
    .skill-chip { position: relative; }
    .delete-skill { margin-left: 4px; font-size: 11px; opacity: 0.6; }
    .delete-skill:hover { color: $danger; opacity: 1; }
    .add-skill-chip { border-style: dashed; }
    .empty { font-family: $font-serif; font-style: italic; font-size: 1.5rem; color: var(--muted); }
    .skill-explanation-modal {
      position: fixed;
      inset: 0;
      background: rgba(10, 10, 10, 0.85);
      backdrop-filter: blur(6px);
      @include flex-center;
      z-index: $z-modal;
      padding: $spacing-lg;
    }
    .modal-content {
      max-width: 560px;
      width: 100%;
      padding: $spacing-xl;
      background: var(--bg);
      border-radius: $border-radius;
      animation: pop 0.4s $ease-out;
    }
    .modal-content h3 { font-size: 2.25rem; text-transform: uppercase; margin: $spacing-xs 0 $spacing-md; }
    .modal-content p { line-height: 1.75; color: var(--muted); margin-bottom: $spacing-lg; }
    @keyframes pop { from { opacity: 0; transform: translateY(20px) scale(0.97); } }
    @media (max-width: $bp-mobile) { .summary-grid { grid-template-columns: 1fr; gap: $spacing-sm; } }
  `]
})
export class ExperienceDetailComponent implements OnInit {
  isAdmin = false;
  experience: WorkExperience | null = null;
  selectedSkill: ExperienceSkill | null = null;
  addingSkill = false;
  newSkill: ExperienceSkill = { skill_name: '', explanation: '', order: 0 };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portfolioService: PortfolioService
  ) {}

  ngOnInit(): void {
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadExperience(id);
  }

  loadExperience(id: number): void {
    this.portfolioService.getExperienceDetail(id).subscribe(exp => {
      this.experience = exp;
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }

  showExplanation(skill: ExperienceSkill): void {
    this.selectedSkill = skill;
  }

  addSkill(): void {
    if (this.experience && this.experience.id) {
      this.portfolioService.addExperienceSkill(this.experience.id, this.newSkill).subscribe(() => {
        this.loadExperience(this.experience!.id!);
        this.cancelAddSkill();
      });
    }
  }

  cancelAddSkill(): void {
    this.addingSkill = false;
    this.newSkill = { skill_name: '', explanation: '', order: 0 };
  }

  deleteSkill(id: number): void {
    if (confirm('Delete this skill?')) {
      this.portfolioService.deleteExperienceSkill(id).subscribe(() => {
        this.loadExperience(this.experience!.id!);
      });
    }
  }
}
