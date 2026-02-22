import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Certification } from '../../models/portfolio.models';

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="certs-section">
      <div class="container">
        <h2 class="section-title">Certifications & Badges</h2>
        
        <div class="carousel">
          <div *ngFor="let cert of certifications" class="cert-item">
            <div class="cert-card" *ngIf="editingCert !== cert.id">
              <img *ngIf="cert.badge_image" [src]="cert.badge_image" [alt]="cert.name" class="badge" />
              <div *ngIf="!cert.badge_image" class="badge-placeholder">🏆</div>
              <h4>{{ cert.name }}</h4>
              <p *ngIf="cert.issuer">{{ cert.issuer }}</p>
              
              <div *ngIf="isAdmin" class="cert-actions">
                <button (click)="startEditCert(cert)">Edit</button>
                <button (click)="deleteCert(cert.id!)">Delete</button>
              </div>
            </div>

            <div class="cert-card edit-mode" *ngIf="editingCert === cert.id">
              <h4>Edit Certification</h4>
              <input [(ngModel)]="editCertData.name" placeholder="Certification Name" />
              <input [(ngModel)]="editCertData.issuer" placeholder="Issuer" />
              <input [(ngModel)]="editCertData.issued_date" type="date" />
              <div class="cert-actions">
                <button (click)="saveEditCert()">Save</button>
                <button (click)="cancelEditCert()">Cancel</button>
              </div>
            </div>

            <div *ngIf="cert.cert_image && showCertImage === cert.id" class="cert-overlay" (click)="showCertImage = null">
              <img [src]="cert.cert_image" alt="Certificate" />
            </div>
          </div>

          <div *ngIf="isAdmin && !adding" class="add-cert" (click)="adding = true">
            <span>+ Add Certification</span>
          </div>
        </div>

        <div *ngIf="adding" class="add-form card">
          <h3>Add Certification</h3>
          <input [(ngModel)]="newCert.name" placeholder="Certification Name" />
          <input [(ngModel)]="newCert.issuer" placeholder="Issuer" />
          
          <div class="file-input-group">
            <label>Badge Image:</label>
            <input type="file" 
                   #badgeInput 
                   (change)="onBadgeUpload($event)" 
                   accept="image/*" 
                   style="display: none;" />
            <button type="button" (click)="badgeInput.click()" class="upload-btn">
              <img src="/assets/icons/camera.svg" alt="Upload" style="width: 16px; height: 16px; filter: brightness(0) invert(1);" />
              Upload Badge
            </button>
            <span *ngIf="badgePreview" class="preview">
              <img [src]="badgePreview" alt="Preview" style="width: 60px; height: 60px; object-fit: contain;" />
              <button type="button" (click)="clearBadge()" class="clear-btn">✕</button>
            </span>
          </div>

          <div class="file-input-group">
            <label>Certificate Image (optional):</label>
            <input type="file" 
                   #certInput 
                   (change)="onCertUpload($event)" 
                   accept="image/*" 
                   style="display: none;" />
            <button type="button" (click)="certInput.click()" class="upload-btn">
              <img src="/assets/icons/camera.svg" alt="Upload" style="width: 16px; height: 16px; filter: brightness(0) invert(1);" />
              Upload Certificate
            </button>
            <span *ngIf="certPreview" class="preview">
              <img [src]="certPreview" alt="Preview" style="width: 60px; height: 60px; object-fit: contain;" />
              <button type="button" (click)="clearCert()" class="clear-btn">✕</button>
            </span>
          </div>

          <input [(ngModel)]="newCert.issued_date" type="date" />
          <button (click)="addCert()">Add</button>
          <button (click)="cancelAdd()">Cancel</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import '../../../theme.scss';
    .certs-section { @include section-container; padding: $spacing-xxl 0; background: #fafafa; }
    .section-title { text-align: center; margin-bottom: $spacing-xxl; }
    .carousel { display: flex; gap: $spacing-lg; overflow-x: auto; padding: $spacing-lg 0; }
    .cert-item { min-width: 250px; }
    .cert-card { @include card-base; text-align: center; cursor: pointer; }
    .cert-card:hover { transform: translateY(-8px); }
    .cert-card.edit-mode { cursor: default; }
    .cert-card.edit-mode:hover { transform: none; }
    .cert-card.edit-mode input { width: 100%; padding: $spacing-sm; margin: $spacing-xs 0; border: $border-width solid $border-color; border-radius: $border-radius; }
    .badge { width: 100%; height: 200px; object-fit: contain; margin-bottom: $spacing-md; }
    .badge-placeholder { width: 100%; height: 200px; @include flex-center; font-size: 4rem; background: #f0f0f0; border-radius: $border-radius; margin-bottom: $spacing-md; }
    .cert-card h4 { margin-bottom: $spacing-sm; }
    .cert-card p { color: $text-secondary; font-size: 14px; }
    .cert-actions { margin-top: $spacing-md; }
    .cert-actions button { font-size: 12px; padding: $spacing-xs $spacing-sm; }
    .add-cert { @include card-base; min-width: 250px; @include flex-center; cursor: pointer; border: 2px dashed $border-color; }
    .add-cert:hover { border-color: $accent-color; }
    .add-form { margin-top: $spacing-lg; display: flex; flex-direction: column; gap: $spacing-sm; max-width: 500px; }
    .add-form input { padding: $spacing-md; border: $border-width solid $border-color; border-radius: $border-radius; }
    .file-input-group { display: flex; flex-direction: column; gap: $spacing-xs; }
    .file-input-group label { font-size: 14px; font-weight: $font-weight-bold; }
    .upload-btn { background: $button-bg; color: $button-text; border: none; padding: $spacing-md; border-radius: $border-radius; cursor: pointer; display: flex; align-items: center; gap: $spacing-xs; justify-content: center; }
    .upload-btn:hover { opacity: 0.9; }
    .preview { display: flex; align-items: center; gap: $spacing-sm; padding: $spacing-sm; background: #f0f0f0; border-radius: $border-radius; }
    .clear-btn { background: black; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1; }
    .clear-btn:hover { background: #ff4444; }
    .cert-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); @include flex-center; z-index: $z-modal; cursor: pointer; }
    .cert-overlay img { max-width: 90%; max-height: 90%; }
  `]
})
export class CertificationsComponent implements OnInit {
  isAdmin = false;
  certifications: Certification[] = [];
  adding = false;
  editingCert: number | null = null;
  showCertImage: number | null = null;
  newCert: Certification = { name: '', issuer: '', order: 0 };
  editCertData: Certification = { name: '', issuer: '', order: 0 };
  badgePreview: string | null = null;
  badgeFile: File | null = null;
  certPreview: string | null = null;
  certFile: File | null = null;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.loadCerts();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadCerts(): void {
    this.portfolioService.getCertifications().subscribe(certs => this.certifications = certs);
  }

  addCert(): void {
    // Upload badge image first if provided
    if (this.badgeFile) {
      this.portfolioService.uploadFile(this.badgeFile).subscribe({
        next: (response) => {
          this.newCert.badge_image = `http://localhost:5001${response.url}`;
          this.uploadCertOrCreate();
        },
        error: () => {
          alert('Failed to upload badge image');
        }
      });
    } else {
      this.uploadCertOrCreate();
    }
  }

  private uploadCertOrCreate(): void {
    // Upload certificate image if provided
    if (this.certFile) {
      this.portfolioService.uploadFile(this.certFile).subscribe({
        next: (response) => {
          this.newCert.cert_image = `http://localhost:5001${response.url}`;
          this.createCertification();
        },
        error: () => {
          alert('Failed to upload certificate image');
        }
      });
    } else {
      this.createCertification();
    }
  }

  private createCertification(): void {
    this.portfolioService.createCertification(this.newCert).subscribe(() => {
      this.loadCerts();
      this.cancelAdd();
    });
  }

  onBadgeUpload(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.badgeFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.badgePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image file');
    }
  }

  clearBadge(): void {
    this.badgeFile = null;
    this.badgePreview = null;
    this.newCert.badge_image = undefined;
  }

  onCertUpload(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.certFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.certPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image file');
    }
  }

  clearCert(): void {
    this.certFile = null;
    this.certPreview = null;
    this.newCert.cert_image = undefined;
  }

  cancelAdd(): void {
    this.adding = false;
    this.newCert = { name: '', issuer: '', order: 0 };
    this.clearBadge();
    this.clearCert();
  }

  startEditCert(cert: Certification): void {
    this.editingCert = cert.id!;
    this.editCertData = { ...cert };
  }

  saveEditCert(): void {
    if (this.editingCert && this.editCertData.name.trim()) {
      this.portfolioService.updateCertification(this.editingCert, this.editCertData).subscribe(() => {
        this.loadCerts();
        this.cancelEditCert();
      });
    }
  }

  cancelEditCert(): void {
    this.editingCert = null;
    this.editCertData = { name: '', issuer: '', order: 0 };
  }

  deleteCert(id: number): void {
    if (confirm('Delete this certification?')) {
      this.portfolioService.deleteCertification(id).subscribe(() => this.loadCerts());
    }
  }
}
