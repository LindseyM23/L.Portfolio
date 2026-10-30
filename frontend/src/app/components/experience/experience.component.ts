import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PortfolioService } from '../../services/portfolio.service';
import { WorkExperience } from '../../models/portfolio.models';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective],
  template: `
    <section class="experience-section dark">
      <div class="container head-container">
        <header class="section-head" appReveal>
          <span class="section-index">(04)</span>
          <h2 class="section-title">Work <em>experience</em></h2>
          <p class="section-kicker">The road so far. Drag, swipe or use the arrows to travel through time.</p>
        </header>

        <div class="controls" appReveal>
          <span class="counter mono">
            <strong>{{ (activeIndex + 1).toString().padStart(2, '0') }}</strong>
            / {{ experiences.length.toString().padStart(2, '0') }}
          </span>
          <button class="nav-btn btn-ghost" (click)="scrollByItem(-1)" [disabled]="atStart" aria-label="Previous">&#x2190;</button>
          <button class="nav-btn btn-ghost" (click)="scrollByItem(1)" [disabled]="atEnd" aria-label="Next">&#x2192;</button>
        </div>
      </div>

      <div class="track"
           #track
           appReveal
           tabindex="0"
           [class.dragging]="isDragging"
           (scroll)="onTrackScroll()"
           (keydown.arrowRight)="scrollByItem(1); $event.preventDefault()"
           (keydown.arrowLeft)="scrollByItem(-1); $event.preventDefault()"
           (pointerdown)="onPointerDown($event)"
           (pointermove)="onPointerMove($event)"
           (pointerup)="onPointerUp()"
           (pointerleave)="onPointerUp()">
        <div class="rail">
          <div *ngFor="let exp of experiences; let i = index; let last = last"
               class="stop"
               [class.current]="!exp.end_date">
            <span class="year" aria-hidden="true">{{ yearOf(exp.start_date) }}</span>
            <div class="node"><span></span></div>

            <article class="card">
              <ng-container *ngIf="editingExp !== exp.id">
                <div class="card-top mono">
                  <span>{{ formatDate(exp.start_date) }} &mdash; {{ exp.end_date ? formatDate(exp.end_date) : 'Present' }}</span>
                  <span class="duration">{{ duration(exp) }}</span>
                </div>
                <h3>{{ exp.role }}</h3>
                <p class="company"><em>{{ exp.company }}</em></p>
                <p class="summary">{{ exp.summary }}</p>

                <div class="card-foot">
                  <button class="btn-sm" (click)="viewDetails(exp.id!)">Learn more &#x2192;</button>
                  <span *ngIf="!exp.end_date" class="now mono"><span class="dot"></span>Now</span>
                </div>

                <div *ngIf="isAdmin" class="admin-actions">
                  <button (click)="startEditExp(exp)">Edit</button>
                  <button class="btn-ghost" (click)="deleteExp(exp.id!)">Delete</button>
                </div>
              </ng-container>

              <div *ngIf="editingExp === exp.id" class="edit-form-inline">
                <h4 class="mono">Edit experience</h4>
                <input [(ngModel)]="editExpData.company" placeholder="Company" />
                <input [(ngModel)]="editExpData.role" placeholder="Role" />
                <input [(ngModel)]="editExpData.start_date" type="date" />
                <input [(ngModel)]="editExpData.end_date" type="date" placeholder="End Date (leave empty if current)" />
                <textarea [(ngModel)]="editExpData.summary" placeholder="Summary" rows="4"></textarea>
                <div class="btn-row">
                  <button (click)="saveEditExp()">Save</button>
                  <button class="btn-ghost" (click)="cancelEditExp()">Cancel</button>
                </div>
              </div>
            </article>
          </div>

          <div *ngIf="experiences.length" class="stop end-cap">
            <span class="year" aria-hidden="true">Next</span>
            <div class="node"><span></span></div>
            <div class="next-card">
              <p>What's <em>next?</em></p>
              <a class="mono" href="#contact">Let's build it together &#x2192;</a>
            </div>
          </div>
        </div>
      </div>

      <div class="container foot-container">
        <div class="progress"><span [style.transform]="'scaleX(' + progress + ')'"></span></div>

        <div *ngIf="isAdmin && !adding" class="add-tile" (click)="adding = true">+ Add experience</div>

        <div *ngIf="adding" class="admin-form">
          <h3>Add experience</h3>
          <input [(ngModel)]="newExp.company" placeholder="Company" />
          <input [(ngModel)]="newExp.role" placeholder="Role" />
          <input [(ngModel)]="newExp.start_date" type="date" placeholder="Start Date" />
          <input [(ngModel)]="newExp.end_date" type="date" placeholder="End Date (leave empty if current)" />
          <textarea [(ngModel)]="newExp.summary" placeholder="Summary" rows="4"></textarea>
          <div class="btn-row">
            <button (click)="addExp()">Add</button>
            <button class="btn-ghost" (click)="cancelAdd()">Cancel</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import '../../../theme.scss';
    :host { display: block; }
    $gutter: clamp(1rem, 4vw, 3rem);
    $inset: max(#{$gutter}, calc((100vw - #{$max-width-content}) / 2 + #{$gutter}));

    .head-container { position: relative; padding-bottom: 0; }
    .head-container .section-head { margin-bottom: $spacing-lg; padding-right: 220px; }
    .controls {
      position: absolute;
      right: $gutter;
      bottom: calc(#{$spacing-lg} + #{$spacing-lg});
      display: flex;
      align-items: center;
      gap: $spacing-xs;
    }
    .counter { margin-right: $spacing-sm; color: var(--muted); }
    .counter strong { color: var(--fg); font-weight: 500; }
    .nav-btn { width: 52px; height: 52px; padding: 0; font-size: 20px; }

    // ---------- Track ----------
    .track {
      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x mandatory;
      scroll-padding-inline: $inset;
      scrollbar-width: none;
      cursor: grab;
      outline: none;
      user-select: none;
    }
    .track::-webkit-scrollbar { display: none; }
    .track.dragging { cursor: grabbing; scroll-snap-type: none; }
    .track:focus-visible .rail { outline: 1px dashed var(--line); outline-offset: 8px; }

    .rail {
      position: relative;
      display: flex;
      width: max-content;
      gap: clamp(1.5rem, 3vw, 2.5rem);
      padding: $spacing-lg $inset $spacing-xl;
    }
    // The horizontal line every stop hangs from
    .rail::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: calc(#{$spacing-lg} + 104px);
      height: 1px;
      background: var(--line);
    }

    .stop {
      position: relative;
      width: clamp(290px, 30vw, 400px);
      scroll-snap-align: start;
      flex-shrink: 0;
    }

    .year {
      display: block;
      height: 96px;
      font-family: $font-display;
      font-size: clamp(3.5rem, 6vw, 5.25rem);
      font-weight: 800;
      line-height: 0.95;
      letter-spacing: -0.05em;
      color: transparent;
      -webkit-text-stroke: 1px var(--fg);
      transition: color $transition-normal;
    }
    .stop:hover .year { color: var(--fg); }

    .node {
      position: relative;
      width: 17px;
      height: 17px;
      margin: 0 0 $spacing-md;
      border-radius: 50%;
      border: 1px solid var(--fg);
      background: var(--bg);
      @include flex-center;
    }
    .node span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--fg);
      transform: scale(0);
      transition: transform $transition-normal;
    }
    .stop:hover .node span, .stop.current .node span { transform: scale(1); }
    .stop.current .node::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 1px solid var(--fg);
      animation: ring 2s $ease-out infinite;
    }
    // Vertical tick from the node down to the card
    .node::before {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      width: 1px;
      height: $spacing-md;
      background: var(--line);
    }

    .card {
      display: flex;
      flex-direction: column;
      min-height: 380px;
      padding: $spacing-lg;
      border: 1px solid var(--line);
      border-radius: $border-radius;
      transition: border-color $transition-normal, background $transition-normal, transform $transition-normal;
    }
    .stop:hover .card { border-color: var(--fg); transform: translateY(-6px); }
    .card-top {
      display: flex;
      justify-content: space-between;
      gap: $spacing-xs;
      font-size: 11px;
      color: var(--muted);
      margin-bottom: $spacing-md;
    }
    .duration { white-space: nowrap; }
    .card h3 { font-size: clamp(1.4rem, 2vw, 1.85rem); line-height: 1.1; margin-bottom: 6px; }
    .company { font-size: 1.25rem; color: var(--muted); margin-bottom: $spacing-md; }
    .summary {
      color: var(--muted);
      font-size: 14.5px;
      line-height: 1.65;
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: $spacing-md;
    }
    .card-foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
    .now { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; }
    .now .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--fg); animation: blink 1.4s infinite; }

    .end-cap { width: clamp(240px, 22vw, 300px); }
    .end-cap .year { -webkit-text-stroke-color: var(--muted); font-family: $font-serif; font-style: italic; font-weight: 400; letter-spacing: -0.02em; }
    .end-cap .node { border-style: dashed; }
    .next-card {
      min-height: 380px;
      padding: $spacing-lg;
      border: 1px dashed var(--line);
      border-radius: $border-radius;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .next-card p { font-family: $font-display; font-size: 2.25rem; font-weight: 700; line-height: 1.05; }
    .next-card a { font-size: 11px; border-bottom: 1px solid var(--fg); padding-bottom: 4px; width: fit-content; }

    .edit-form-inline { display: flex; flex-direction: column; gap: $spacing-xs; user-select: text; }

    // ---------- Progress ----------
    .foot-container { padding-top: 0; }
    .progress { height: 2px; background: var(--line); overflow: hidden; }
    .progress span {
      display: block;
      height: 100%;
      background: var(--fg);
      transform-origin: left;
      transition: transform 0.15s linear;
    }
    .add-tile { margin-top: $spacing-xl; min-height: 100px; }

    @keyframes ring {
      from { transform: scale(0.6); opacity: 1; }
      to { transform: scale(1.8); opacity: 0; }
    }
    @keyframes blink { 50% { opacity: 0.2; } }

    @media (max-width: $bp-mobile) {
      .head-container .section-head { padding-right: 0; }
      .controls { position: static; margin-bottom: $spacing-md; justify-content: flex-end; }
      .year { height: 72px; font-size: 4rem; }
      .rail::before { top: calc(#{$spacing-lg} + 80px); }
      .stop { width: 82vw; }
    }
  `]
})
export class ExperienceComponent implements OnInit {
  isAdmin = false;
  experiences: WorkExperience[] = [];
  adding = false;
  editingExp: number | null = null;
  newExp: WorkExperience = { company: '', role: '', start_date: '', order: 0 };
  editExpData: WorkExperience = { company: '', role: '', start_date: '', order: 0 };

  @ViewChild('track') track?: ElementRef<HTMLElement>;
  activeIndex = 0;
  progress = 0;
  atStart = true;
  atEnd = false;
  isDragging = false;
  private dragStartX = 0;
  private dragStartScroll = 0;

  constructor(
    private portfolioService: PortfolioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExperiences();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadExperiences(): void {
    this.portfolioService.getExperience().subscribe(exps => {
      // Oldest on the left, most recent on the right
      this.experiences = [...exps].sort((a, b) => a.start_date.localeCompare(b.start_date));
      setTimeout(() => {
        // Start at the earliest role (snap can otherwise cling to a stale target)
        if (this.track) this.track.nativeElement.scrollLeft = 0;
        this.onTrackScroll();
      });
    });
  }

  yearOf(date: string): number {
    return new Date(date).getFullYear();
  }

  duration(exp: WorkExperience): string {
    const start = new Date(exp.start_date);
    const end = exp.end_date ? new Date(exp.end_date) : new Date();
    const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts = [];
    if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
    if (rest) parts.push(`${rest} mo${rest > 1 ? 's' : ''}`);
    return parts.join(' ');
  }

  // ---------- Horizontal timeline ----------
  private get itemStep(): number {
    const el = this.track?.nativeElement;
    const stop = el?.querySelector<HTMLElement>('.stop');
    if (!el || !stop) return 0;
    const gap = parseFloat(getComputedStyle(stop.parentElement!).columnGap) || 0;
    return stop.offsetWidth + gap;
  }

  scrollByItem(direction: number): void {
    this.track?.nativeElement.scrollBy({ left: direction * this.itemStep, behavior: 'smooth' });
  }

  onTrackScroll(): void {
    const el = this.track?.nativeElement;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    this.progress = max > 0 ? el.scrollLeft / max : 1;
    this.atStart = el.scrollLeft <= 2;
    this.atEnd = el.scrollLeft >= max - 2;
    const step = this.itemStep;
    const index = step ? Math.round(el.scrollLeft / step) : 0;
    this.activeIndex = this.atEnd ? this.experiences.length - 1 : Math.min(index, this.experiences.length - 1);
  }

  onPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (event.pointerType !== 'mouse' || target.closest('input, textarea, button, a')) return;
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartScroll = this.track!.nativeElement.scrollLeft;
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    const delta = event.clientX - this.dragStartX;
    this.track!.nativeElement.scrollLeft = this.dragStartScroll - delta;
  }

  onPointerUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    // Let scroll-snap settle on the nearest stop
    const el = this.track!.nativeElement;
    const step = this.itemStep;
    if (step) el.scrollTo({ left: Math.round(el.scrollLeft / step) * step, behavior: 'smooth' });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }

  viewDetails(id: number): void {
    this.router.navigate(['/experience', id]);
  }

  addExp(): void {
    this.portfolioService.createExperience(this.newExp).subscribe(() => {
      this.loadExperiences();
      this.cancelAdd();
    });
  }

  cancelAdd(): void {
    this.adding = false;
    this.newExp = { company: '', role: '', start_date: '', order: 0 };
  }

  startEditExp(exp: WorkExperience): void {
    this.editingExp = exp.id!;
    this.editExpData = { ...exp };
  }

  saveEditExp(): void {
    if (this.editingExp && this.editExpData.company.trim() && this.editExpData.role.trim()) {
      this.portfolioService.updateExperience(this.editingExp, this.editExpData).subscribe(() => {
        this.loadExperiences();
        this.cancelEditExp();
      });
    }
  }

  cancelEditExp(): void {
    this.editingExp = null;
    this.editExpData = { company: '', role: '', start_date: '', order: 0 };
  }

  deleteExp(id: number): void {
    if (confirm('Delete this experience?')) {
      this.portfolioService.deleteExperience(id).subscribe(() => this.loadExperiences());
    }
  }
}
