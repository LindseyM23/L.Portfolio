import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Service } from '../../models/portfolio.models';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="services-section">
      <div class="container">
        <h2 class="section-title">What I Do</h2>
        
        <div class="services-grid">
          <div *ngFor="let service of services" class="service-card">
            <div *ngIf="!isEditing(service.id)" class="service-content">
              <h3>{{ service.title }}</h3>
              <p>{{ service.description }}</p>
              <div *ngIf="isAdmin" class="card-actions">
                <button (click)="startEdit(service)">
                  <img src="/assets/icons/edit.svg" alt="Edit" style="width: 16px; height: 16px; filter: brightness(0) invert(1);" />
                </button>
                <button (click)="deleteService(service.id!)">🗑️</button>
              </div>
            </div>
            
            <div *ngIf="isEditing(service.id)" class="edit-form">
              <input [(ngModel)]="editData.title" placeholder="Title" />
              <textarea [(ngModel)]="editData.description" rows="4"></textarea>
              <button (click)="saveService()">Save</button>
              <button (click)="cancelEdit()">Cancel</button>
            </div>
          </div>

          <div *ngIf="isAdmin && !adding" class="add-card" (click)="adding = true">
            <span class="add-icon">+</span>
            <p>Add Service</p>
          </div>

          <div *ngIf="adding" class="service-card">
            <div class="edit-form">
              <input [(ngModel)]="newService.title" placeholder="Service Title" />
              <textarea [(ngModel)]="newService.description" placeholder="Description" rows="4"></textarea>
              <button (click)="addService()">Add</button>
              <button (click)="cancelAdd()">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import '../../../theme.scss';
    .services-section { @include section-container; padding: $spacing-xxl 0; }
    .section-title { text-align: center; margin-bottom: $spacing-xxl; }
    .services-grid { @include responsive-grid(3); }
    .service-card { @include card-base; position: relative; }
    .service-content h3 { margin-bottom: $spacing-md; }
    .service-content p { color: $text-secondary; line-height: 1.6; }
    .card-actions { margin-top: $spacing-md; display: flex; gap: $spacing-sm; }
    .card-actions button { padding: $spacing-xs $spacing-sm; font-size: 14px; }
    .add-card { @include card-base; @include flex-center; flex-direction: column; cursor: pointer; min-height: 200px; border: 2px dashed $border-color; }
    .add-card:hover { border-color: $accent-color; }
    .add-icon { font-size: 3rem; }
    .edit-form { display: flex; flex-direction: column; gap: $spacing-sm; }
    .edit-form input, .edit-form textarea { padding: $spacing-md; border: $border-width solid $border-color; border-radius: $border-radius; font-family: $font-family; }
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
