import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Contact } from '../../models/portfolio.models';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="contact-section">
      <div class="container">
        <h2 class="section-title">Get In Touch</h2>
        
        <div class="contact-grid">
          <div class="contact-info card">
            <div *ngIf="!editing" class="info-display">
              <div class="contact-item" *ngIf="contact.email">
                <span class="icon">📧</span>
                <a [href]="'mailto:' + contact.email">{{ contact.email }}</a>
              </div>
              <div class="contact-item" *ngIf="contact.phone">
                <span class="icon">📱</span>
                <a [href]="'tel:' + contact.phone">{{ contact.phone }}</a>
              </div>
              <div class="contact-item" *ngIf="contact.linkedin">
                <span class="icon">💼</span>
                <a [href]="contact.linkedin" target="_blank">LinkedIn</a>
              </div>
              <div class="contact-item" *ngIf="contact.github">
                <span class="icon">💻</span>
                <a [href]="contact.github" target="_blank">GitHub</a>
              </div>
              <div class="contact-item" *ngIf="contact.location">
                <span class="icon">📍</span>
                <span>{{ contact.location }}</span>
              </div>
              <div class="contact-item" *ngIf="contact.cv_url">
                <span class="icon">📄</span>
                <a [href]="contact.cv_url" target="_blank">Download CV</a>
              </div>
              
              <button *ngIf="isAdmin" (click)="editing = true" class="edit-contact-btn">
                <img src="/assets/icons/edit.svg" alt="Edit" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px; filter: brightness(0) invert(1);" />
                Edit Contact Info
              </button>
            </div>

            <div *ngIf="editing" class="edit-form">
              <input [(ngModel)]="contact.email" placeholder="Email" type="email" />
              <input [(ngModel)]="contact.phone" placeholder="Phone" />
              <input [(ngModel)]="contact.linkedin" placeholder="LinkedIn URL" />
              <input [(ngModel)]="contact.github" placeholder="GitHub URL" />
              <input [(ngModel)]="contact.location" placeholder="Location" />
              <input [(ngModel)]="contact.cv_url" placeholder="CV URL" />
              <button (click)="saveContact()">Save</button>
              <button (click)="editing = false">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import '../../../theme.scss';
    .contact-section { @include section-container; padding: $spacing-xxl 0; }
    .section-title { text-align: center; margin-bottom: $spacing-xxl; }
    .contact-grid { max-width: 600px; margin: 0 auto; }
    .contact-info { padding: $spacing-xl; }
    .contact-item { display: flex; align-items: center; gap: $spacing-md; margin-bottom: $spacing-lg; font-size: 1.1rem; }
    .contact-item .icon { font-size: 1.5rem; }
    .contact-item a { font-weight: $font-weight-bold; }
    .edit-contact-btn { margin-top: $spacing-lg; }
    .edit-form { display: flex; flex-direction: column; gap: $spacing-md; }
    .edit-form input { padding: $spacing-md; border: $border-width solid $border-color; border-radius: $border-radius; font-family: $font-family; }
  `]
})
export class ContactComponent implements OnInit {
  isAdmin = false;
  contact: Contact = {};
  editing = false;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.loadContact();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadContact(): void {
    this.portfolioService.getContact().subscribe(contact => this.contact = contact);
  }

  saveContact(): void {
    this.portfolioService.updateContact(this.contact).subscribe(() => {
      this.editing = false;
      this.loadContact();
    });
  }
}
