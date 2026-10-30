import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaUrlPipe } from './media-url.pipe';

/**
 * Cross-fading image slideshow. Auto-advances, pauses on hover.
 * Anything projected inside is shown when there are no images.
 */
@Component({
  selector: 'app-slideshow',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe],
  template: `
    <div class="slides" (mouseenter)="pause()" (mouseleave)="play()">
      <img *ngFor="let src of images; let i = index"
           [src]="src | mediaUrl"
           [alt]="alt + ' — image ' + (i + 1)"
           [class.active]="i === index"
           draggable="false" />

      <ng-content *ngIf="!images.length"></ng-content>

      <ng-container *ngIf="images.length > 1">
        <button class="arrow prev" (click)="go(-1, $event)" aria-label="Previous image">&#x2190;</button>
        <button class="arrow next" (click)="go(1, $event)" aria-label="Next image">&#x2192;</button>

        <div class="dots">
          <button *ngFor="let src of images; let i = index"
                  [class.on]="i === index"
                  (click)="goTo(i, $event)"
                  [attr.aria-label]="'Show image ' + (i + 1)"></button>
        </div>
        <span class="count">{{ (index + 1).toString().padStart(2, '0') }} / {{ images.length.toString().padStart(2, '0') }}</span>
      </ng-container>
    </div>
  `,
  styles: [`
    @import '../../theme.scss';
    :host { display: block; position: absolute; inset: 0; }
    .slides { position: relative; width: 100%; height: 100%; overflow: hidden; background: $black; }
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transform: scale(1.06);
      filter: grayscale(1);
      transition: opacity 1s $ease-out, transform 6s linear, filter $transition-slow;
    }
    img.active { opacity: 1; transform: scale(1); }
    :host-context(.project:hover) img, .slides:hover img { filter: none; }
    .arrow {
      position: absolute;
      top: 50%;
      width: 44px;
      height: 44px;
      padding: 0;
      margin-top: -22px;
      font-size: 18px;
      background: $white;
      color: $black;
      border-color: $white;
      opacity: 0;
      transition: opacity $transition-fast, transform $transition-fast;
    }
    .arrow:hover { background: $black; color: $white; }
    .prev { left: 14px; }
    .next { right: 14px; }
    .slides:hover .arrow { opacity: 1; }
    .dots {
      position: absolute;
      left: 50%;
      bottom: 16px;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
    }
    .dots button {
      width: 22px;
      height: 3px;
      padding: 0;
      border: none;
      border-radius: 0;
      background: rgba(250, 250, 247, 0.4);
    }
    .dots button.on { background: $white; width: 36px; }
    .count {
      position: absolute;
      right: 18px;
      bottom: 12px;
      font-family: $font-mono;
      font-size: 10px;
      letter-spacing: 0.12em;
      color: $white;
      mix-blend-mode: difference;
    }
    @media (hover: none) { .arrow { opacity: 1; } }
  `]
})
export class SlideshowComponent implements OnChanges, OnDestroy {
  @Input() images: string[] = [];
  @Input() alt = '';
  @Input() interval = 4500;

  index = 0;
  private timer?: ReturnType<typeof setInterval>;

  ngOnChanges(): void {
    if (this.index >= this.images.length) this.index = 0;
    this.play();
  }

  ngOnDestroy(): void {
    this.pause();
  }

  play(): void {
    this.pause();
    if (this.images.length > 1) {
      this.timer = setInterval(() => this.index = (this.index + 1) % this.images.length, this.interval);
    }
  }

  pause(): void {
    clearInterval(this.timer);
  }

  go(step: number, event: Event): void {
    event.stopPropagation();
    this.index = (this.index + step + this.images.length) % this.images.length;
  }

  goTo(i: number, event: Event): void {
    event.stopPropagation();
    this.index = i;
  }
}
