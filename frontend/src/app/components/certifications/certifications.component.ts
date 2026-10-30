import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Certification } from '../../models/portfolio.models';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { ModalComponent } from '../../shared/modal.component';
import { MediaUrlPipe } from '../../shared/media-url.pipe';

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective, ModalComponent, MediaUrlPipe],
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
            <div class="cert-card"
                 [class.clickable]="cert.cert_image"
                 (click)="cert.cert_image && (showCertImage = cert.id!)">
              <span class="cert-num mono">No. {{ (i + 1).toString().padStart(2, '0') }}</span>
              <div class="badge-wrap">
                <img *ngIf="cert.badge_image" [src]="cert.badge_image | mediaUrl" [alt]="cert.name" class="badge" />
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
          </article>

          <div *ngIf="isAdmin" class="add-tile" (click)="adding = true">+ Add certification</div>
        </div>
      </div>
    </section>

    <div *ngIf="certImage" class="cert-overlay" (click)="showCertImage = null">
      <img [src]="certImage | mediaUrl" alt="Certificate" />
    </div>

    <app-modal [open]="editingCert !== null" title="Edit certification" kicker="Certs & badges" (closed)="cancelEditCert()">
      <label class="field"><span>Name</span><input [(ngModel)]="editCertData.name" /></label>
      <div class="field-row">
        <label class="field"><span>Issuer</span><input [(ngModel)]="editCertData.issuer" /></label>
        <label class="field"><span>Issued</span><input [(ngModel)]="editCertData.issued_date" type="date" /></label>
      </div>
      <ng-container modal-actions><button (click)="saveEditCert()">Save changes</button></ng-container>
    </app-modal>

    <app-modal [open]="adding" title="Add certification" kicker="Certs & badges" (closed)="cancelAdd()">
      <label class="field"><span>Name</span><input [(ngModel)]="newCert.name" placeholder="e.g. AWS Certified Developer" /></label>
      <div class="field-row">
        <label class="field"><span>Issuer</span><input [(ngModel)]="newCert.issuer" placeholder="e.g. AWS" /></label>
        <label class="field"><span>Issued</span><input [(ngModel)]="newCert.issued_date" type="date" /></label>
      </div>

      <div class="field">
        <span>Badge image</span>
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
      </div>

      <div class="field">
        <span>Certificate image (optional)</span>
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
      </div>
      <ng-container modal-actions><button (click)="addCert()">Add certification</button></ng-container>
    </app-modal>
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
    .cert-card:hover {
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
    @media (max-width: $bp-mobile) {
      .certs-grid { grid-template-columns: 1fr; gap: $spacing-sm; }
      .cert-card {
        display: grid;
        grid-template-columns: 88px 1fr;
        align-items: center;
        column-gap: $spacing-md;
        padding: $spacing-md;
        text-align: left;
      }
      .cert-card:hover { transform: none; box-shadow: 5px 5px 0 var(--fg); }
      .cert-num { position: static; grid-column: 2; margin-bottom: 2px; }
      .badge-wrap { grid-column: 1; grid-row: 1 / span 4; width: 88px; height: 88px; margin: 0; outline-offset: 5px; transform: none; }
      .cert-card h4 { grid-column: 2; font-size: 1rem; transform: none; }
      .cert-meta { grid-column: 2; justify-content: flex-start; font-size: 10px; }
      .admin-actions { grid-column: 1 / -1; justify-content: flex-start; }
    }
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

  constructor(
    private portfolioService: PortfolioService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit(): void {
    this.loadCerts();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  get certImage(): string | undefined {
    return this.certifications.find(c => c.id === this.showCertImage)?.cert_image;
  }

  loadCerts(): void {
    this.portfolioService.getCertifications().subscribe(certs => this.certifications = certs);
  }

  addCert(): void {
    if (!this.toast.require({ Name: this.newCert.name })) return;
    // Upload badge image first if provided
    if (this.badgeFile) {
      this.portfolioService.uploadFile(this.badgeFile).subscribe({
        next: (response) => {
          this.newCert.badge_image = response.url;
          this.uploadCertOrCreate();
        },
        error: err => this.toast.apiError(err, 'Could not upload badge image')
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
          this.newCert.cert_image = response.url;
          this.createCertification();
        },
        error: err => this.toast.apiError(err, 'Could not upload certificate image')
      });
    } else {
      this.createCertification();
    }
  }

  private createCertification(): void {
    this.portfolioService.createCertification(this.newCert).subscribe({
      next: () => {
        this.loadCerts();
        this.cancelAdd();
        this.toast.success('Certification added');
      },
      error: err => this.toast.apiError(err, 'Could not add certification')
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
      this.toast.error('Unsupported file', 'Please choose an image file (PNG, JPG, SVG, WebP or GIF).');
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
      this.toast.error('Unsupported file', 'Please choose an image file (PNG, JPG, SVG, WebP or GIF).');
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
    if (!this.editingCert || !this.toast.require({ Name: this.editCertData.name })) return;
    this.portfolioService.updateCertification(this.editingCert, this.editCertData).subscribe({
      next: () => {
        this.loadCerts();
        this.cancelEditCert();
        this.toast.success('Certification updated');
      },
      error: err => this.toast.apiError(err, 'Could not update certification')
    });
  }

  cancelEditCert(): void {
    this.editingCert = null;
    this.editCertData = { name: '', issuer: '', order: 0 };
  }

  async deleteCert(id: number): Promise<void> {
    if (!(await this.confirm.delete('certification', this.certifications.find(c => c.id === id)?.name))) return;
    this.portfolioService.deleteCertification(id).subscribe({
      next: () => {
        this.loadCerts();
        this.toast.success('Certification deleted');
      },
      error: err => this.toast.apiError(err, 'Could not delete certification')
    });
  }
}
