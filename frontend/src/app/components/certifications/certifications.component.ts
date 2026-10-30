import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Certification } from '../../models/portfolio.models';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective],
  template: `
    <section class="certs-section">
      <div class="container">
        <header class="section-head" appReveal>
          <span class="section-index">(03)</span>
          <h2 class="section-title">Certs <em>&amp;</em> badges</h2>
          <p class="section-kicker">Credentials earned along the way, verified and on the record.</p>
        </header>

        <div class="certs-grid">
          <article *ngFor="let cert of certifications; let i = index" class="cert-item" appReveal [revealDelay]="i * 0.1">
            <div class="cert-card" *ngIf="editingCert !== cert.id"
                 [class.clickable]="cert.cert_image"
                 (click)="cert.cert_image && (showCertImage = cert.id!)">
              <span class="cert-num mono">No. {{ (i + 1).toString().padStart(2, '0') }}</span>
              <div class="badge-wrap">
                <img *ngIf="cert.badge_image" [src]="cert.badge_image" [alt]="cert.name" class="badge" />
                <span *ngIf="!cert.badge_image" class="badge-placeholder">&#x2726;</span>
              </div>
              <h4>{{ cert.name }}</h4>
              <p class="mono cert-meta">
                <span *ngIf="cert.issuer">{{ cert.issuer }}</span>
                <span *ngIf="cert.issued_date">{{ cert.issued_date | date:'MMM yyyy' }}</span>
              </p>

              <div *ngIf="isAdmin" class="admin-actions" (click)="$event.stopPropagation()">
                <button (click)="startEditCert(cert)">Edit</button>
                <button class="btn-ghost" (click)="deleteCert(cert.id!)">Delete</button>
              </div>
            </div>

            <div class="cert-card edit-mode" *ngIf="editingCert === cert.id">
              <h4 class="mono">Edit certification</h4>
              <input [(ngModel)]="editCertData.name" placeholder="Certification Name" />
              <input [(ngModel)]="editCertData.issuer" placeholder="Issuer" />
              <input [(ngModel)]="editCertData.issued_date" type="date" />
              <div class="btn-row">
                <button (click)="saveEditCert()">Save</button>
                <button class="btn-ghost" (click)="cancelEditCert()">Cancel</button>
              </div>
            </div>

            <div *ngIf="cert.cert_image && showCertImage === cert.id" class="cert-overlay" (click)="showCertImage = null">
              <img [src]="cert.cert_image" alt="Certificate" />
            </div>
          </article>

          <div *ngIf="isAdmin && !adding" class="add-tile" (click)="adding = true">+ Add certification</div>
        </div>

        <div *ngIf="adding" class="admin-form">
          <h3>Add certification</h3>
          <input [(ngModel)]="newCert.name" placeholder="Certification Name" />
          <input [(ngModel)]="newCert.issuer" placeholder="Issuer" />

          <label>Badge image</label>
          <div class="file-row">
            <input type="file" #badgeInput (change)="onBadgeUpload($event)" accept="image/*" hidden />
            <button type="button" (click)="badgeInput.click()" class="btn-sm">
              <img src="assets/icons/camera.svg" alt="" class="ico" />
              Upload badge
            </button>
            <span *ngIf="badgePreview" class="preview">
              <img [src]="badgePreview" alt="Preview" />
              <button type="button" (click)="clearBadge()" class="btn-sm btn-ghost">✕</button>
            </span>
          </div>

          <label>Certificate image (optional)</label>
          <div class="file-row">
            <input type="file" #certInput (change)="onCertUpload($event)" accept="image/*" hidden />
            <button type="button" (click)="certInput.click()" class="btn-sm">
              <img src="assets/icons/camera.svg" alt="" class="ico" />
              Upload certificate
            </button>
            <span *ngIf="certPreview" class="preview">
              <img [src]="certPreview" alt="Preview" />
              <button type="button" (click)="clearCert()" class="btn-sm btn-ghost">✕</button>
            </span>
          </div>

          <input [(ngModel)]="newCert.issued_date" type="date" />
          <div class="btn-row">
            <button (click)="addCert()">Add</button>
            <button class="btn-ghost" (click)="cancelAdd()">Cancel</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import '../../../theme.scss';
    :host { display: block; }
    .certs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: $spacing-lg;
    }
    .cert-item { perspective: 1000px; }
    .cert-card {
      position: relative;
      height: 100%;
      padding: $spacing-lg;
      border: 1px solid var(--fg);
      border-radius: $border-radius;
      background: var(--bg);
      text-align: center;
      transition: transform $transition-normal, box-shadow $transition-normal;
      transform-style: preserve-3d;
    }
    .cert-card:not(.edit-mode):hover {
      transform: rotateX(6deg) rotateY(-8deg) translateY(-6px);
      box-shadow: 10px 14px 0 var(--fg);
    }
    .cert-card.clickable { cursor: zoom-in; }
    .cert-num { position: absolute; top: 16px; left: 18px; font-size: 10px; color: var(--muted); }
    .badge-wrap {
      position: relative;
      width: 180px;
      height: 180px;
      margin: $spacing-md auto $spacing-lg;
      @include flex-center;
      border-radius: 50%;
      border: 1px solid var(--line);
      outline: 1px dashed var(--line);
      outline-offset: 10px;
      transform: translateZ(40px);
    }
    .badge {
      width: 82%;
      height: 82%;
      object-fit: contain;
      filter: grayscale(1) contrast(1.15);
      transition: filter $transition-slow, transform $transition-slow;
    }
    .cert-card:hover .badge { filter: none; transform: scale(1.06); }
    .badge-placeholder { font-size: 4rem; }
    .cert-card h4 { font-size: 1.15rem; line-height: 1.25; margin-bottom: $spacing-xs; transform: translateZ(20px); }
    .cert-meta { display: flex; justify-content: center; gap: $spacing-sm; color: var(--muted); font-size: 11px; }
    .cert-meta span + span::before { content: '/'; margin-right: $spacing-sm; }
    .admin-actions { justify-content: center; }
    .cert-card.edit-mode { display: flex; flex-direction: column; gap: $spacing-xs; text-align: left; }
    .file-row { display: flex; align-items: center; gap: $spacing-sm; flex-wrap: wrap; }
    .preview { display: inline-flex; align-items: center; gap: $spacing-xs; }
    .preview img { width: 56px; height: 56px; object-fit: contain; }
    .cert-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 10, 10, 0.92);
      @include flex-center;
      z-index: $z-modal;
      cursor: zoom-out;
    }
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
