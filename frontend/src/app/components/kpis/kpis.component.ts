import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { KPI } from '../../models/portfolio.models';

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="kpis-section">
      <div class="container">
        <h2 class="section-title">Key Performance Indicators</h2>
        
        <div *ngIf="kpis.length === 0" class="empty-state">
          <p>Lindsey has no upcoming KPIs</p>
        </div>

        <div class="kpis-grid">
          <div *ngFor="let kpi of kpis" class="kpi-card" [class]="'status-' + kpi.status.toLowerCase().replace(' ', '-')">
            <div class="status-badge">{{ kpi.status }}</div>
            <h3>{{ kpi.title }}</h3>
            <p>{{ kpi.description }}</p>
            <p *ngIf="kpi.target_date" class="target-date">🎯 Target: {{ formatDate(kpi.target_date) }}</p>
            
            <div *ngIf="isAdmin" class="kpi-actions">
              <button (click)="deleteKPI(kpi.id!)">Delete</button>
            </div>
          </div>

          <div *ngIf="isAdmin && !adding" class="add-kpi" (click)="adding = true">
            <span>+ Add KPI</span>
          </div>
        </div>

        <div *ngIf="adding" class="add-form card">
          <h3>Add KPI</h3>
          <input [(ngModel)]="newKPI.title" placeholder="KPI Title" />
          <textarea [(ngModel)]="newKPI.description" placeholder="Description" rows="4"></textarea>
          <select [(ngModel)]="newKPI.status">
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <input [(ngModel)]="newKPI.target_date" type="date" />
          <select [(ngModel)]="newKPI.visibility">
            <option value="Public">Public</option>
            <option value="Coming Soon">Coming Soon</option>
          </select>
          <button (click)="addKPI()">Add</button>
          <button (click)="cancelAdd()">Cancel</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import '../../../theme.scss';
    .kpis-section { @include section-container; padding: $spacing-xxl 0; background: #fafafa; }
    .section-title { text-align: center; margin-bottom: $spacing-xxl; }
    .empty-state { text-align: center; padding: $spacing-xxl; color: $text-secondary; font-size: 1.2rem; }
    .kpis-grid { @include responsive-grid(3); }
    .kpi-card { @include card-base; position: relative; }
    .status-badge { display: inline-block; padding: $spacing-xs $spacing-md; background: $button-bg; color: $button-text; border-radius: $border-radius; font-size: 12px; font-weight: $font-weight-bold; margin-bottom: $spacing-md; }
    .kpi-card.status-completed .status-badge { background: #4caf50; }
    .kpi-card.status-in-progress .status-badge { background: #ff9800; }
    .kpi-card.status-planned .status-badge { background: #2196f3; }
    .kpi-card h3 { margin-bottom: $spacing-sm; }
    .kpi-card p { color: $text-secondary; line-height: 1.6; margin-bottom: $spacing-md; }
    .target-date { font-size: 14px; font-weight: $font-weight-bold; }
    .kpi-actions { margin-top: $spacing-md; }
    .add-kpi { @include card-base; @include flex-center; min-height: 200px; cursor: pointer; border: 2px dashed $border-color; }
    .add-kpi:hover { border-color: $accent-color; }
    .add-form { margin-top: $spacing-lg; max-width: 600px; margin: $spacing-xl auto; display: flex; flex-direction: column; gap: $spacing-sm; }
    .add-form input, .add-form textarea, .add-form select { padding: $spacing-md; border: $border-width solid $border-color; border-radius: $border-radius; font-family: $font-family; }
  `]
})
export class KpisComponent implements OnInit {
  isAdmin = false;
  kpis: KPI[] = [];
  adding = false;
  newKPI: KPI = { title: '', description: '', status: 'Planned', visibility: 'Public', order: 0 };

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.loadKPIs();
    this.portfolioService.adminMode$.subscribe(mode => {
      this.isAdmin = mode;
      this.loadKPIs();
    });
  }

  loadKPIs(): void {
    if (this.isAdmin) {
      this.portfolioService.getAllKPIs().subscribe(kpis => this.kpis = kpis);
    } else {
      this.portfolioService.getKPIs().subscribe(kpis => this.kpis = kpis);
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  addKPI(): void {
    this.portfolioService.createKPI(this.newKPI).subscribe(() => {
      this.loadKPIs();
      this.cancelAdd();
    });
  }

  cancelAdd(): void {
    this.adding = false;
    this.newKPI = { title: '', description: '', status: 'Planned', visibility: 'Public', order: 0 };
  }

  deleteKPI(id: number): void {
    if (confirm('Delete this KPI?')) {
      this.portfolioService.deleteKPI(id).subscribe(() => this.loadKPIs());
    }
  }
}
