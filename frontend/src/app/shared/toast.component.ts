import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

/** Renders the toast stack. Place once in the app shell. */
@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stack" aria-live="polite" aria-atomic="false">
      <div *ngFor="let toast of toastService.toasts$ | async; trackBy: trackById"
           class="toast"
           [ngClass]="toast.type"
           [attr.role]="toast.type === 'error' ? 'alert' : 'status'">
        <span class="glyph" aria-hidden="true">{{ glyphs[toast.type] }}</span>
        <div class="text">
          <p class="title">{{ toast.title }}</p>
          <p *ngIf="toast.message" class="message">{{ toast.message }}</p>
        </div>
        <button type="button" class="close" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss">✕</button>
        <span class="timer" [style.animation-duration]="toast.duration + 'ms'"></span>
      </div>
    </div>
  `,
  styles: [`
    @import '../../theme.scss';
    .stack {
      position: fixed;
      top: calc(#{$header-height} + 8px);
      right: clamp(1rem, 3vw, 2rem);
      z-index: $z-tooltip + 1;
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      width: min(380px, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast {
      position: relative;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: start;
      gap: 12px;
      padding: 14px 14px 16px;
      overflow: hidden;
      background: $black;
      color: $white;
      border: 1px solid rgba(250, 250, 247, 0.2);
      border-radius: 14px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      animation: slide-in 0.45s $ease-out both;
    }
    .glyph {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 13px;
      font-weight: 700;
      background: $white;
      color: $black;
    }
    // Errors invert to stand out while staying monochrome
    .toast.error { background: $white; color: $black; border: 2px solid $black; }
    .toast.error .glyph { background: $black; color: $white; }
    .toast.error .message { color: rgba(10, 10, 10, 0.7); }
    .toast.error .timer { background: $black; }
    .toast.info .glyph { background: transparent; color: $white; border: 1px solid $white; }
    .title { font-weight: 600; font-size: 14px; line-height: 1.35; }
    .message { margin-top: 2px; font-size: 13px; line-height: 1.45; color: rgba(250, 250, 247, 0.7); }
    .close {
      all: unset;
      cursor: pointer;
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      font-size: 11px;
      opacity: 0.6;
    }
    .close:hover { opacity: 1; }
    .timer {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 2px;
      width: 100%;
      background: $white;
      transform-origin: left;
      animation: shrink linear forwards;
    }
    @keyframes slide-in { from { opacity: 0; transform: translateX(24px); } }
    @keyframes shrink { to { transform: scaleX(0); } }
    @media (max-width: $bp-mobile) {
      // Top of the screen, clear of bottom-sheet modals and the admin indicator
      .stack { top: 1rem; left: 1rem; right: 1rem; width: auto; }
      @keyframes slide-in { from { opacity: 0; transform: translateY(-16px); } }
    }
  `]
})
export class ToastComponent {
  glyphs = { success: '✓', error: '!', info: 'i' };

  constructor(public toastService: ToastService) {}

  trackById(_: number, toast: { id: number }): number {
    return toast.id;
  }
}
