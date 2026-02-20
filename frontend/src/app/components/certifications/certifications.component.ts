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
            <div class="cert-card">
              <img *ngIf="cert.badge_image" [src]="cert.badge_image" [alt]="cert.name" class="badge" />
              <div *ngIf="!cert.badge_image" class="badge-placeholder">🏆</div>
              <h4>{{ cert.name }}</h4>
              <p *ngIf="cert.issuer">{{ cert.issuer }}</p>
              
              <div *ngIf="isAdmin" class="cert-actions">
                <button (click)="deleteCert(cert.id!)">Delete</button>
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
          <input [(ngModel)]="newCert.badge_image" placeholder="Badge Image URL" />
          <input [(ngModel)]="newCert.cert_image" placeholder="Certificate Image URL" />
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
    .cert-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); @include flex-center; z-index: $z-modal; cursor: pointer; }
    .cert-overlay img { max-width: 90%; max-height: 90%; }
  `]
})
export class CertificationsComponent implements OnInit {
  isAdmin = false;
  certifications: Certification[] = [];
  adding = false;
  showCertImage: number | null = null;
  newCert: Certification = { name: '', issuer: '', order: 0 };

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.loadCerts();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadCerts(): void {
    this.portfolioService.getCertifications().subscribe(certs => this.certifications = certs);
  }

  addCert(): void {
    this.portfolioService.createCertification(this.newCert).subscribe(() => {
      this.loadCerts();
      this.cancelAdd();
    });
  }

  cancelAdd(): void {
    this.adding = false;
    this.newCert = { name: '', issuer: '', order: 0 };
  }

  deleteCert(id: number): void {
    if (confirm('Delete this certification?')) {
      this.portfolioService.deleteCertification(id).subscribe(() => this.loadCerts());
    }
  }
}
