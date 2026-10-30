import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../services/confirm.service';
import { ModalComponent } from './modal.component';

/** Renders ConfirmService requests in the shared modal. Place once in the app shell. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <ng-container *ngIf="confirm.request$ | async as request">
      <app-modal [open]="true" [title]="request.title" [kicker]="request.kicker ?? ''" (closed)="confirm.answer(false)">
        <p class="message">{{ request.message }}</p>
        <ng-container modal-actions>
          <button class="confirm-btn" (click)="confirm.answer(true)">{{ request.confirmText ?? 'Confirm' }}</button>
        </ng-container>
      </app-modal>
    </ng-container>
  `,
  styles: [`
    .message { color: var(--muted); line-height: 1.6; }
  `]
})
export class ConfirmDialogComponent {
  constructor(public confirm: ConfirmService) {}
}
