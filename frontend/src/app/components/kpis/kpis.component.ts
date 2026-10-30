import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { KPI } from '../../models/portfolio.models';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective, ModalComponent],
  template: `
    <section class="kpis-section dark">
      <div class="container">
        <header class="section-head" appReveal>
          <span class="section-index">(06)</span>
          <h2 class="section-title">On the <em>roadmap</em></h2>
          <p class="section-kicker">Goals I'm holding myself to: what's planned, in motion and done.</p>
        </header>

        <div *ngIf="kpis.length === 0" class="empty-state">
          <p>Lindsey has no upcoming KPIs</p>
        </div>

        <div class="kpis-grid">
          <article *ngFor="let kpi of kpis; let i = index" class="kpi-card" [ngClass]="'status-' + statusKey(kpi.status)" appReveal [revealDelay]="i * 0.08">
            <ng-container>
              <div class="kpi-top">
                <span class="kpi-num">{{ (i + 1).toString().padStart(2, '0') }}</span>
                <span class="status-badge mono"><span class="glyph"></span>{{ kpi.status }}</span>
              </div>
              <h3>{{ kpi.title }}</h3>
              <p class="desc">{{ kpi.description }}</p>

              <div class="kpi-foot">
                <div class="meter" [attr.aria-label]="kpi.status">
                  <span *ngFor="let step of [0, 1, 2]" [class.on]="step < statusLevel(kpi.status)"></span>
                </div>
                <span *ngIf="kpi.target_date" class="target-date mono">Target &middot; {{ formatDate(kpi.target_date) }}</span>
                <span *ngIf="isAdmin && kpi.visibility === 'Coming Soon'" class="mono hidden-tag">Hidden &middot; coming soon</span>
              </div>

              <div *ngIf="isAdmin" class="admin-actions">
                <button (click)="startEditKPI(kpi)">Edit</button>
                <button class="btn-ghost" (click)="deleteKPI(kpi.id!)">Delete</button>
              </div>
            </ng-container>
          </article>

          <div *ngIf="isAdmin" class="add-tile" (click)="adding = true">+ Add KPI</div>
        </div>
      </div>
    </section>

    <app-modal [open]="editingKPI !== null" title="Edit KPI" kicker="Roadmap" (closed)="cancelEditKPI()">
      <label class="field"><span>Title</span><input [(ngModel)]="editKPIData.title" /></label>
      <label class="field"><span>Description</span><textarea [(ngModel)]="editKPIData.description" rows="5"></textarea></label>
      <div class="field-row">
        <label class="field"><span>Status</span>
          <select [(ngModel)]="editKPIData.status">
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
        <label class="field"><span>Target date</span><input [(ngModel)]="editKPIData.target_date" type="date" /></label>
      </div>
      <label class="field"><span>Visibility</span>
        <select [(ngModel)]="editKPIData.visibility">
          <option value="Public">Public</option>
          <option value="Coming Soon">Coming Soon (hidden from visitors)</option>
        </select>
      </label>
      <ng-container modal-actions><button (click)="saveEditKPI()">Save changes</button></ng-container>
    </app-modal>

    <app-modal [open]="adding" title="Add KPI" kicker="Roadmap" (closed)="cancelAdd()">
      <label class="field"><span>Title</span><input [(ngModel)]="newKPI.title" /></label>
      <label class="field"><span>Description</span><textarea [(ngModel)]="newKPI.description" rows="5"></textarea></label>
      <div class="field-row">
        <label class="field"><span>Status</span>
          <select [(ngModel)]="newKPI.status">
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
        <label class="field"><span>Target date</span><input [(ngModel)]="newKPI.target_date" type="date" /></label>
      </div>
      <label class="field"><span>Visibility</span>
        <select [(ngModel)]="newKPI.visibility">
          <option value="Public">Public</option>
          <option value="Coming Soon">Coming Soon (hidden from visitors)</option>
        </select>
      </label>
      <ng-container modal-actions><button (click)="addKPI()">Add KPI</button></ng-container>
    </app-modal>
  `,
  styles: [`
    @import '../../../theme.scss';
    :host { display: block; }
    .empty-state { text-align: center; padding: $spacing-xl; color: var(--muted); font-family: $font-serif; font-style: italic; font-size: 1.75rem; }
    .kpis-grid { @include responsive-grid(3, 0); border-top: 1px solid var(--fg); }
    .kpi-card {
      display: flex;
      flex-direction: column;
      min-height: 360px;
      padding: $spacing-lg $spacing-lg $spacing-lg 0;
      border-bottom: 1px solid var(--line);
      transition: background $transition-normal;
    }
    .kpi-card:not(:nth-child(3n+1)) { padding-left: $spacing-lg; border-left: 1px solid var(--line); }
    .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: $spacing-lg; }
    .kpi-num {
      font-family: $font-display;
      font-size: 4.5rem;
      font-weight: 800;
      line-height: 0.8;
      letter-spacing: -0.05em;
      color: transparent;
      -webkit-text-stroke: 1px var(--fg);
      transition: color $transition-normal;
    }
    .kpi-card:hover .kpi-num { color: var(--fg); }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border: 1px solid var(--fg);
      border-radius: $pill;
      font-size: 10px;
    }
    .glyph { width: 10px; height: 10px; border-radius: 50%; border: 1px solid var(--fg); }
    .status-in-progress .glyph { background: linear-gradient(90deg, var(--fg) 50%, transparent 50%); }
    .status-completed .glyph { background: var(--fg); }
    .status-completed .status-badge { background: var(--fg); color: var(--bg); }
    .status-completed .status-badge .glyph { background: var(--bg); border-color: var(--bg); }
    .kpi-card h3 { font-size: 1.6rem; line-height: 1.1; margin-bottom: $spacing-sm; }
    .desc { color: var(--muted); line-height: 1.65; font-size: 15px; margin-bottom: $spacing-md; }
    .kpi-foot { margin-top: auto; display: flex; flex-direction: column; gap: $spacing-xs; }
    .meter { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
    .meter span { height: 4px; background: var(--line); }
    .meter span.on { background: var(--fg); }
    .target-date, .hidden-tag { font-size: 10px; color: var(--muted); }
    .add-tile { margin: $spacing-lg; }
    @media (max-width: $bp-tablet) {
      .kpi-card, .kpi-card:not(:nth-child(3n+1)) { padding: $spacing-lg 0; border-left: none; min-height: 0; }
    }
  `]
})
export class KpisComponent implements OnInit {
  isAdmin = false;
  kpis: KPI[] = [];
  adding = false;
  editingKPI: number | null = null;
  newKPI: KPI = { title: '', description: '', status: 'Planned', visibility: 'Public', order: 0 };
  editKPIData: KPI = { title: '', description: '', status: 'Planned', visibility: 'Public', order: 0 };

  constructor(
    private portfolioService: PortfolioService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

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
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }

  statusKey(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  statusLevel(status: KPI['status']): number {
    return { 'Planned': 1, 'In Progress': 2, 'Completed': 3 }[status] ?? 0;
  }

  addKPI(): void {
    if (!this.toast.require({ Title: this.newKPI.title, Description: this.newKPI.description, Status: this.newKPI.status })) return;
    this.portfolioService.createKPI(this.newKPI).subscribe({
      next: () => {
        this.loadKPIs();
        this.cancelAdd();
        this.toast.success('KPI added');
      },
      error: err => this.toast.apiError(err, 'Could not add KPI')
    });
  }

  cancelAdd(): void {
    this.adding = false;
    this.newKPI = { title: '', description: '', status: 'Planned', visibility: 'Public', order: 0 };
  }

  startEditKPI(kpi: KPI): void {
    this.editingKPI = kpi.id!;
    this.editKPIData = { ...kpi };
  }

  saveEditKPI(): void {
    if (!this.editingKPI || !this.toast.require({ Title: this.editKPIData.title, Description: this.editKPIData.description, Status: this.editKPIData.status })) return;
    this.portfolioService.updateKPI(this.editingKPI, this.editKPIData).subscribe({
      next: () => {
        this.loadKPIs();
        this.cancelEditKPI();
        this.toast.success('KPI updated');
      },
      error: err => this.toast.apiError(err, 'Could not update KPI')
    });
  }

  cancelEditKPI(): void {
    this.editingKPI = null;
    this.editKPIData = { title: '', description: '', status: 'Planned', visibility: 'Public', order: 0 };
  }

  async deleteKPI(id: number): Promise<void> {
    if (!(await this.confirm.delete('KPI', this.kpis.find(k => k.id === id)?.title))) return;
    this.portfolioService.deleteKPI(id).subscribe({
      next: () => {
        this.loadKPIs();
        this.toast.success('KPI deleted');
      },
      error: err => this.toast.apiError(err, 'Could not delete KPI')
    });
  }
}
