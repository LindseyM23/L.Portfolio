import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Service } from '../../models/portfolio.models';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective, ModalComponent],
  template: `
    <section class="services-section dark">
      <div class="container">
        <header class="section-head" appReveal>
          <span class="section-index">(02)</span>
          <h2 class="section-title">What I <em>do</em></h2>
          <p class="section-kicker">From the first sketch to production in the cloud: the services I bring to teams and clients.</p>
        </header>

        <ol class="services-list">
          <li *ngFor="let service of services; let i = index" class="service-row" appReveal [revealDelay]="i * 0.05">
            <ng-container>
              <span class="service-num mono">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <h3 class="service-title">{{ service.title }}</h3>
              <p class="service-desc">{{ service.description }}</p>
              <span class="service-arrow" aria-hidden="true">&#x2197;</span>
              <div *ngIf="isAdmin" class="admin-actions">
                <button (click)="startEdit(service)" aria-label="Edit">
                  <img src="assets/icons/edit.svg" alt="" class="ico" />
                </button>
                <button class="btn-ghost" (click)="deleteService(service.id!)">Delete</button>
              </div>
            </ng-container>
          </li>
        </ol>

        <div *ngIf="isAdmin" class="add-tile" (click)="adding = true">+ Add service</div>
      </div>
    </section>

    <app-modal [open]="editingId !== null" title="Edit service" kicker="What I do" (closed)="cancelEdit()">
      <label class="field"><span>Title</span><input [(ngModel)]="editData.title" /></label>
      <label class="field"><span>Description</span><textarea [(ngModel)]="editData.description" rows="6"></textarea></label>
      <ng-container modal-actions><button (click)="saveService()">Save changes</button></ng-container>
    </app-modal>

    <app-modal [open]="adding" title="Add service" kicker="What I do" (closed)="cancelAdd()">
      <label class="field"><span>Title</span><input [(ngModel)]="newService.title" placeholder="e.g. Cloud Development" /></label>
      <label class="field"><span>Description</span><textarea [(ngModel)]="newService.description" rows="6"></textarea></label>
      <ng-container modal-actions><button (click)="addService()">Add service</button></ng-container>
    </app-modal>
  `,
  styles: [`
    @import '../../../theme.scss';
    :host { display: block; }
    .services-list { list-style: none; border-top: 1px solid var(--fg); }
    .service-row {
      position: relative;
      display: grid;
      grid-template-columns: 80px 1.1fr 1fr 48px;
      align-items: center;
      gap: $spacing-lg;
      padding: clamp(1.5rem, 3vw, 2.5rem) $spacing-sm;
      border-bottom: 1px solid var(--line);
      isolation: isolate;
      transition: color $transition-normal;
    }
    .service-row::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: $white;
      transform: scaleY(0);
      transform-origin: bottom;
      transition: transform $transition-normal;
    }
    .service-row:hover { color: $black; --muted: rgba(10,10,10,0.6); --fg: #{$black}; --bg: #{$white}; --line: rgba(10,10,10,0.15); --icon-on-fg: invert(1); }
    .service-row:hover::before { transform: scaleY(1); transform-origin: top; }
    .service-num { color: var(--muted); }
    .service-title {
      font-size: clamp(1.6rem, 3.6vw, 3rem);
      text-transform: uppercase;
      transition: transform $transition-normal;
    }
    .service-row:hover .service-title { transform: translateX(12px); }
    .service-desc { color: var(--muted); font-size: 15px; line-height: 1.6; max-width: 46ch; white-space: pre-line; }
    .service-arrow {
      font-size: 1.75rem;
      justify-self: end;
      transition: transform $transition-normal;
    }
    .service-row:hover .service-arrow { transform: rotate(45deg); }
    .admin-actions { grid-column: 2 / -1; margin-top: 0; }
        .add-tile { margin-top: $spacing-lg; min-height: 100px; }
    @media (max-width: $bp-mobile) {
      .service-row { grid-template-columns: 32px 1fr; gap: 6px $spacing-xs; padding: $spacing-md 0; }
      .service-title { font-size: 1.2rem; line-height: 1.1; }
      .service-desc { font-size: 14px; line-height: 1.55; }
      .service-row:hover .service-title { transform: none; }
      .service-desc { grid-column: 2; }
      .service-arrow { display: none; }
    }
  `]
})
export class ServicesComponent implements OnInit {
  isAdmin = false;
  services: Service[] = [];
  adding = false;
  editingId: number | null = null;
  newService: Service = { title: '', description: '', order: 0 };
  editData: Service = { title: '', description: '', order: 0 };

  constructor(
    private portfolioService: PortfolioService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit(): void {
    this.loadServices();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadServices(): void {
    this.portfolioService.getServices().subscribe(services => this.services = services);
  }

  isEditing(id?: number): boolean {
    return this.editingId === id;
  }

  startEdit(service: Service): void {
    this.editingId = service.id!;
    this.editData = { ...service };
  }

  saveService(): void {
    if (!this.editingId || !this.toast.require({ Title: this.editData.title, Description: this.editData.description })) return;
    this.portfolioService.updateService(this.editingId, this.editData).subscribe({
      next: () => {
        this.loadServices();
        this.cancelEdit();
        this.toast.success('Service updated');
      },
      error: err => this.toast.apiError(err, 'Could not update service')
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editData = { title: '', description: '', order: 0 };
  }

  addService(): void {
    if (!this.toast.require({ Title: this.newService.title, Description: this.newService.description })) return;
    this.portfolioService.createService(this.newService).subscribe({
      next: () => {
        this.loadServices();
        this.cancelAdd();
        this.toast.success('Service added');
      },
      error: err => this.toast.apiError(err, 'Could not add service')
    });
  }

  cancelAdd(): void {
    this.adding = false;
    this.newService = { title: '', description: '', order: 0 };
  }

  async deleteService(id: number): Promise<void> {
    if (!(await this.confirm.delete('service', this.services.find(sv => sv.id === id)?.title))) return;
    this.portfolioService.deleteService(id).subscribe({
      next: () => {
        this.loadServices();
        this.toast.success('Service deleted');
      },
      error: err => this.toast.apiError(err, 'Could not delete service')
    });
  }
}
