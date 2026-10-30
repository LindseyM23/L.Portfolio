import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Service } from '../../models/portfolio.models';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective],
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
            <ng-container *ngIf="!isEditing(service.id)">
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

            <div *ngIf="isEditing(service.id)" class="edit-form">
              <input [(ngModel)]="editData.title" placeholder="Title" />
              <textarea [(ngModel)]="editData.description" rows="4"></textarea>
              <div class="btn-row">
                <button (click)="saveService()">Save</button>
                <button class="btn-ghost" (click)="cancelEdit()">Cancel</button>
              </div>
            </div>
          </li>
        </ol>

        <div *ngIf="isAdmin && !adding" class="add-tile" (click)="adding = true">+ Add service</div>

        <div *ngIf="adding" class="admin-form">
          <h4>Add service</h4>
          <input [(ngModel)]="newService.title" placeholder="Service Title" />
          <textarea [(ngModel)]="newService.description" placeholder="Description" rows="4"></textarea>
          <div class="btn-row">
            <button (click)="addService()">Add</button>
            <button class="btn-ghost" (click)="cancelAdd()">Cancel</button>
          </div>
        </div>
      </div>
    </section>
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
    .edit-form { grid-column: 1 / -1; display: flex; flex-direction: column; gap: $spacing-xs; }
    .add-tile { margin-top: $spacing-lg; min-height: 100px; }
    @media (max-width: $bp-mobile) {
      .service-row { grid-template-columns: 40px 1fr; gap: $spacing-xs $spacing-sm; }
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

  constructor(private portfolioService: PortfolioService) {}

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
    if (this.editingId) {
      this.portfolioService.updateService(this.editingId, this.editData).subscribe(() => {
        this.loadServices();
        this.cancelEdit();
      });
    }
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editData = { title: '', description: '', order: 0 };
  }

  addService(): void {
    this.portfolioService.createService(this.newService).subscribe(() => {
      this.loadServices();
      this.cancelAdd();
    });
  }

  cancelAdd(): void {
    this.adding = false;
    this.newService = { title: '', description: '', order: 0 };
  }

  deleteService(id: number): void {
    if (confirm('Delete this service?')) {
      this.portfolioService.deleteService(id).subscribe(() => this.loadServices());
    }
  }
}
