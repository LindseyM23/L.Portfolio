import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PortfolioService } from '../../services/portfolio.service';
import { WorkExperience } from '../../models/portfolio.models';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="experience-section">
      <div class="container">
        <h2 class="section-title">Work Experience</h2>
        
        <div class="timeline">
          <div *ngFor="let exp of experiences; let i = index" class="timeline-item" [class.left]="i % 2 === 0" [class.right]="i % 2 !== 0">
            <div class="timeline-content card">
              <h3>{{ exp.role }}</h3>
              <h4>{{ exp.company }}</h4>
              <p class="period">{{ formatDate(exp.start_date) }} - {{ exp.end_date ? formatDate(exp.end_date) : 'Present' }}</p>
              <p class="summary">{{ exp.summary }}</p>
              
              <button class="learn-more-btn" (click)="viewDetails(exp.id!)">Learn More →</button>
              
              <div *ngIf="isAdmin" class="exp-actions">
                <button (click)="deleteExp(exp.id!)">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="isAdmin && !adding" class="add-experience">
          <button (click)="adding = true">+ Add Experience</button>
        </div>

        <div *ngIf="adding" class="add-form card">
          <h3>Add Experience</h3>
          <input [(ngModel)]="newExp.company" placeholder="Company" />
          <input [(ngModel)]="newExp.role" placeholder="Role" />
          <input [(ngModel)]="newExp.start_date" type="date" placeholder="Start Date" />
          <input [(ngModel)]="newExp.end_date" type="date" placeholder="End Date (leave empty if current)" />
          <textarea [(ngModel)]="newExp.summary" placeholder="Summary" rows="4"></textarea>
          <button (click)="addExp()">Add</button>
          <button (click)="cancelAdd()">Cancel</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import '../../../theme.scss';
    .experience-section { @include section-container; padding: $spacing-xxl 0; }
    .section-title { text-align: center; margin-bottom: $spacing-xxl; }
    .timeline { position: relative; max-width: 900px; margin: 0 auto; }
    .timeline::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: $border-color; }
    .timeline-item { margin-bottom: $spacing-xxl; position: relative; }
    .timeline-content { max-width: 400px; position: relative; }
    .timeline-item.left .timeline-content { margin-right: auto; margin-left: 0; }
    .timeline-item.right .timeline-content { margin-left: auto; margin-right: 0; }
    .timeline-content h3 { margin-bottom: $spacing-xs; }
    .timeline-content h4 { color: $text-secondary; margin-bottom: $spacing-sm; }
    .period { font-size: 14px; color: $text-secondary; margin-bottom: $spacing-md; }
    .summary { line-height: 1.6; margin-bottom: $spacing-md; }
    .learn-more-btn { margin-top: $spacing-md; padding: $spacing-sm $spacing-lg; font-size: 14px; }
    .exp-actions { margin-top: $spacing-md; }
    .add-experience { text-align: center; margin-top: $spacing-xl; }
    .add-form { max-width: 600px; margin: $spacing-xl auto; display: flex; flex-direction: column; gap: $spacing-sm; }
    .add-form input, .add-form textarea { padding: $spacing-md; border: $border-width solid $border-color; border-radius: $border-radius; font-family: $font-family; }
    @media (max-width: 768px) { 
      .timeline::before { left: 20px; }
      .timeline-item.left .timeline-content, .timeline-item.right .timeline-content { margin-left: 40px; margin-right: 0; }
    }
  `]
})
export class ExperienceComponent implements OnInit {
  isAdmin = false;
  experiences: WorkExperience[] = [];
  adding = false;
  newExp: WorkExperience = { company: '', role: '', start_date: '', order: 0 };

  constructor(
    private portfolioService: PortfolioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExperiences();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadExperiences(): void {
    this.portfolioService.getExperience().subscribe(exps => this.experiences = exps);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }

  viewDetails(id: number): void {
    this.router.navigate(['/experience', id]);
  }

  addExp(): void {
    this.portfolioService.createExperience(this.newExp).subscribe(() => {
      this.loadExperiences();
      this.cancelAdd();
    });
  }

  cancelAdd(): void {
    this.adding = false;
    this.newExp = { company: '', role: '', start_date: '', order: 0 };
  }

  deleteExp(id: number): void {
    if (confirm('Delete this experience?')) {
      this.portfolioService.deleteExperience(id).subscribe(() => this.loadExperiences());
    }
  }
}
