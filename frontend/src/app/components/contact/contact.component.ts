import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { Contact } from '../../models/portfolio.models';
import { ToastService } from '../../services/toast.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective, ModalComponent],
  template: `
    <section class="contact-section">
      <div class="container">
        <header class="section-head" appReveal>
          <span class="section-index">(07)</span>
          <h2 class="section-title">Get in <em>touch</em></h2>
        </header>

        <div class="contact-body">
          <div class="cta" appReveal>
            <p class="cta-line">Have a project in mind?</p>
            <p class="cta-big">Let's <em>talk.</em></p>
            <a *ngIf="contact.email" class="email" [href]="'mailto:' + contact.email">
              <span>{{ contact.email }}</span>
              <span class="arrow">&#x2197;</span>
            </a>
          </div>

          <ul class="details">
            <li *ngIf="contact.phone" appReveal>
              <span class="mono">Phone</span>
              <a [href]="'tel:' + contact.phone">{{ contact.phone }}</a>
            </li>
            <li *ngIf="contact.location" appReveal>
              <span class="mono">Location</span>
              <span>{{ contact.location }}</span>
            </li>
            <li *ngIf="contact.linkedin" appReveal>
              <span class="mono">LinkedIn</span>
              <a [href]="contact.linkedin" target="_blank" rel="noopener">Connect <span class="arrow">&#x2197;</span></a>
            </li>
            <li *ngIf="contact.github" appReveal>
              <span class="mono">GitHub</span>
              <a [href]="contact.github" target="_blank" rel="noopener">Browse code <span class="arrow">&#x2197;</span></a>
            </li>
            <li *ngIf="contact.cv_url" appReveal>
              <span class="mono">Résumé</span>
              <a [href]="contact.cv_url" target="_blank" rel="noopener">Download CV <span class="arrow">&#x2193;</span></a>
            </li>
          </ul>

          <button *ngIf="isAdmin" (click)="startEdit()" class="edit-contact-btn btn-sm">
            <img src="assets/icons/edit.svg" alt="" class="ico" />
            Edit contact info
          </button>
        </div>
      </div>
    </section>

    <app-modal [open]="editing" title="Edit contact info" kicker="Get in touch" (closed)="editing = false">
      <div class="field-row">
        <label class="field"><span>Email</span><input [(ngModel)]="draft.email" type="email" /></label>
        <label class="field"><span>Phone</span><input [(ngModel)]="draft.phone" /></label>
      </div>
      <label class="field"><span>Location</span><input [(ngModel)]="draft.location" /></label>
      <div class="field-row">
        <label class="field"><span>LinkedIn URL</span><input [(ngModel)]="draft.linkedin" /></label>
        <label class="field"><span>GitHub URL</span><input [(ngModel)]="draft.github" /></label>
      </div>
      <label class="field"><span>CV URL</span><input [(ngModel)]="draft.cv_url" /></label>
      <ng-container modal-actions><button (click)="saveContact()">Save changes</button></ng-container>
    </app-modal>

    <footer class="footer dark">
      <div class="footer-inner">
        <div class="footer-row mono">
          <span>&copy; {{ year }} Lindsey Monyepao</span>
          <span>Johannesburg &middot; {{ localTime }}</span>
          <a href="#hero" class="top-link">Back to top &#x2191;</a>
        </div>
        <p class="wordmark" aria-hidden="true">Lindsey<em>.</em></p>
      </div>
    </footer>
  `,
  styles: [`
    @import '../../../theme.scss';
    :host { display: block; }
    .contact-body {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: $spacing-xl;
      align-items: end;
    }
    .cta-line { font-family: $font-mono; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); }
    .cta-big {
      font-family: $font-display;
      font-size: clamp(4rem, 12vw, 10rem);
      font-weight: 800;
      line-height: 0.9;
      letter-spacing: -0.05em;
      margin: $spacing-sm 0 $spacing-lg;
    }
    .email {
      display: inline-flex;
      align-items: center;
      gap: $spacing-sm;
      position: relative;
      font-size: clamp(1.1rem, 2.6vw, 2rem);
      font-weight: 500;
      padding-bottom: 6px;
      word-break: break-all;
    }
    .email::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 2px;
      background: var(--fg);
      transform-origin: right;
      transition: transform $transition-normal;
    }
    .email:hover::after { transform: scaleX(0); }
    .arrow { display: inline-block; transition: transform $transition-normal; }
    .email:hover .arrow, .details a:hover .arrow { transform: rotate(45deg); }
    .details { list-style: none; border-top: 1px solid var(--fg); }
    .details li {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: $spacing-sm;
      padding: 18px 0;
      border-bottom: 1px solid var(--line);
      text-align: right;
    }
    .details .mono { color: var(--muted); }
    .details a { font-weight: 500; }
    .details a:hover { text-decoration: underline; text-underline-offset: 4px; }
    .edit-contact-btn { grid-column: 1 / -1; justify-self: start; }

    .footer { overflow: hidden; }
    .footer-inner { max-width: $max-width-content; margin: 0 auto; padding: $spacing-xl clamp(1rem, 4vw, 3rem) 0; }
    .footer-row {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: $spacing-sm;
      color: var(--muted);
      padding-bottom: $spacing-lg;
      border-bottom: 1px solid var(--line);
    }
    .top-link { color: var(--fg); }
    .top-link:hover { text-decoration: underline; text-underline-offset: 4px; }
    .wordmark {
      font-family: $font-display;
      font-size: clamp(2rem, 11.2vw, 10rem);
      font-weight: 800;
      line-height: 0.8;
      letter-spacing: -0.06em;
      text-transform: uppercase;
      text-align: center;
      white-space: nowrap;
      padding: $spacing-md 0 0.12em;
    }
    @media (max-width: $bp-mobile) {
      .contact-body { grid-template-columns: 1fr; }
    }
  `]
})
export class ContactComponent implements OnInit, OnDestroy {
  isAdmin = false;
  contact: Contact = {};
  editing = false;
  draft: Contact = {};
  year = new Date().getFullYear();
  localTime = '';
  private clock?: ReturnType<typeof setInterval>;

  constructor(private portfolioService: PortfolioService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadContact();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
    this.tick();
    this.clock = setInterval(() => this.tick(), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.clock);
  }

  private tick(): void {
    this.localTime = new Date().toLocaleTimeString('en-ZA', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg'
    }) + ' SAST';
  }

  loadContact(): void {
    this.portfolioService.getContact().subscribe(contact => this.contact = contact);
  }

  startEdit(): void {
    this.draft = { ...this.contact };
    this.editing = true;
  }

  saveContact(): void {
    const email = this.draft.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.toast.error('Check the email address', `"${email}" doesn't look like a valid email.`);
      return;
    }
    this.portfolioService.updateContact(this.draft).subscribe({
      next: () => {
        this.editing = false;
        this.loadContact();
        this.toast.success('Contact info updated');
      },
      error: err => this.toast.apiError(err, 'Could not update contact info')
    });
  }
}
