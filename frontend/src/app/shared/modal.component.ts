import {
  AfterViewInit, Component, ElementRef, EventEmitter, HostListener,
  Input, OnChanges, OnDestroy, Output, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable pop-up dialog for admin add/edit forms.
 *
 * <app-modal [open]="adding" title="Add experience" (closed)="cancelAdd()">
 *   <label class="field"><span>Company</span><input [(ngModel)]="..." /></label>
 *   <ng-container modal-actions>
 *     <button (click)="save()">Save</button>
 *   </ng-container>
 * </app-modal>
 *
 * The host element is moved to <body> so the dialog is never clipped or
 * offset by transformed/overflow-hidden ancestors. Closes on Esc, backdrop
 * click or the ✕ button by emitting `closed`.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="backdrop" (mousedown)="onBackdrop($event)">
      <div class="panel" role="dialog" aria-modal="true" [attr.aria-label]="title" [class.wide]="wide">
        <header class="panel-head">
          <div>
            <span *ngIf="kicker" class="kicker">{{ kicker }}</span>
            <h3>{{ title }}</h3>
          </div>
          <button type="button" class="close" (click)="closed.emit()" aria-label="Close">✕</button>
        </header>

        <div class="panel-body">
          <ng-content></ng-content>
        </div>

        <footer class="panel-foot">
          <ng-content select="[modal-actions]"></ng-content>
          <button type="button" class="btn-ghost" (click)="closed.emit()">Cancel</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    @import '../../theme.scss';
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: $z-modal;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $spacing-md;
      background: rgba(10, 10, 10, 0.72);
      backdrop-filter: blur(6px);
      animation: fade 0.25s ease both;
    }
    // The dialog always uses the light palette, whatever section opened it
    .panel {
      --bg: #{$white};
      --fg: #{$black};
      --muted: rgba(10, 10, 10, 0.58);
      --line: rgba(10, 10, 10, 0.14);
      --icon-on-fg: invert(1);
      --icon-on-bg: none;
      color-scheme: light;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 560px;
      max-height: min(88vh, 860px);
      background: var(--bg);
      color: var(--fg);
      border-radius: $border-radius;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
      animation: rise 0.4s $ease-out both;
    }
    .panel.wide { max-width: 760px; }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: $spacing-sm;
      padding: $spacing-md $spacing-lg;
      border-bottom: 1px solid var(--line);
    }
    .kicker { @include mono-label; font-size: 10px; color: var(--muted); display: block; margin-bottom: 4px; }
    h3 { font-size: 1.5rem; text-transform: uppercase; }
    .close { width: 36px; height: 36px; padding: 0; flex-shrink: 0; font-size: 14px; }
    .panel-body {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
      padding: $spacing-lg;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
    .panel-foot {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-xs;
      padding: $spacing-md $spacing-lg;
      border-top: 1px solid var(--line);
    }
    @keyframes fade { from { opacity: 0; } }
    @keyframes rise { from { opacity: 0; transform: translateY(24px) scale(0.98); } }
    @keyframes sheet { from { transform: translateY(100%); } }

    // Bottom sheet on phones
    @media (max-width: $bp-mobile) {
      .backdrop { align-items: flex-end; padding: 0; }
      .panel {
        max-width: none;
        max-height: 92vh;
        border-radius: $border-radius $border-radius 0 0;
        animation: sheet 0.4s $ease-out both;
      }
      .panel-head, .panel-body, .panel-foot { padding-left: $spacing-md; padding-right: $spacing-md; }
      h3 { font-size: 1.2rem; }
    }
  `]
})
export class ModalComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  @Input() kicker = '';
  @Input() wide = false;
  @Output() closed = new EventEmitter<void>();

  private static openCount = 0;
  private locked = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    document.body.appendChild(this.el.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      this.setScrollLock(this.open);
      if (this.open) {
        // Focus the first field once the panel has rendered
        setTimeout(() => this.el.nativeElement.querySelector<HTMLElement>('.panel-body input, .panel-body textarea, .panel-body select')?.focus());
      }
    }
  }

  ngOnDestroy(): void {
    this.setScrollLock(false);
    this.el.nativeElement.remove();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.closed.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  // Shared counter so nested/sequential dialogs don't unlock the page early
  private setScrollLock(lock: boolean): void {
    if (lock === this.locked) return;
    this.locked = lock;
    ModalComponent.openCount += lock ? 1 : -1;
    document.body.style.overflow = ModalComponent.openCount > 0 ? 'hidden' : '';
  }
}
