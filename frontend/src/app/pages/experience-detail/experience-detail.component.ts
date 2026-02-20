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
      <div class="container">
        <a routerLink="/" class="back-link">← Back to Portfolio</a>
        
        <div *ngIf="experience" class="experience-detail card">
          <h1>{{ experience.role }}</h1>
          <h2>{{ experience.company }}</h2>
          <p class="period">{{ formatDate(experience.start_date) }} - {{ experience.end_date ? formatDate(experience.end_date) : 'Present' }}</p>
          <p class="summary">{{ experience.summary }}</p>

          <div class="skills-section">
            <h3>Skills Acquired</h3>
            <div class="skills-grid">
              <div *ngFor="let skill of experience.skills_acquired" class="skill-chip" (click)="showExplanation(skill)">
                <span>{{ skill.skill_name }}</span>
                <button *ngIf="isAdmin" class="delete-skill" (click)="deleteSkill(skill.id!); $event.stopPropagation()">✕</button>
              </div>

              <button *ngIf="isAdmin && !addingSkill" class="add-skill-chip" (click)="addingSkill = true">
                + Add Skill
              </button>
            </div>

            <div *ngIf="addingSkill" class="add-skill-form">
              <input [(ngModel)]="newSkill.skill_name" placeholder="Skill Name" />
              <textarea [(ngModel)]="newSkill.explanation" placeholder="What did you do to acquire this skill?" rows="4"></textarea>
              <button (click)="addSkill()">Add</button>
              <button (click)="cancelAddSkill()">Cancel</button>
            </div>
          </div>

          <div *ngIf="selectedSkill" class="skill-explanation-modal" (click)="selectedSkill = null">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <h3>{{ selectedSkill.skill_name }}</h3>
              <p>{{ selectedSkill.explanation }}</p>
              <button (click)="selectedSkill = null">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../theme.scss';
    .detail-page { min-height: 100vh; padding: $spacing-xxl 0; }
    .container { @include section-container; }
    .back-link { display: inline-block; margin-bottom: $spacing-lg; }
    .experience-detail { max-width: 800px; margin: 0 auto; }
    .experience-detail h1 { margin-bottom: $spacing-xs; }
    .experience-detail h2 { color: $text-secondary; margin-bottom: $spacing-sm; }
    .period { font-size: 14px; color: $text-secondary; margin-bottom: $spacing-lg; }
    .summary { line-height: 1.8; margin-bottom: $spacing-xl; }
    .skills-section h3 { margin-bottom: $spacing-md; }
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: $spacing-md; margin-bottom: $spacing-lg; }
    .skill-chip { @include card-base; cursor: pointer; padding: $spacing-md; text-align: center; font-weight: $font-weight-bold; position: relative; }
    .skill-chip:hover { background: $button-bg; color: $button-text; }
    .delete-skill { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.1); border: none; width: 20px; height: 20px; border-radius: 50%; font-size: 12px; }
    .add-skill-chip { background: transparent; border: 2px dashed $border-color; }
    .add-skill-chip:hover { border-color: $accent-color; background: transparent; }
    .add-skill-form { display: flex; flex-direction: column; gap: $spacing-sm; max-width: 500px; }
    .add-skill-form input, .add-skill-form textarea { padding: $spacing-md; border: $border-width solid $border-color; border-radius: $border-radius; font-family: $font-family; }
    .skill-explanation-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); @include flex-center; z-index: $z-modal; }
    .modal-content { @include card-base; max-width: 600px; margin: $spacing-lg; }
    .modal-content h3 { margin-bottom: $spacing-md; }
    .modal-content p { line-height: 1.8; margin-bottom: $spacing-lg; }
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
