import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  kicker?: string;
}

export interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based confirmation dialog, rendered by <app-confirm-dialog>
 * in the app shell using the shared modal.
 *
 *   if (!(await this.confirm.ask({ title: 'Delete project?', message: '…' }))) return;
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private requestSubject = new BehaviorSubject<ConfirmRequest | null>(null);
  request$ = this.requestSubject.asObservable();

  ask(options: ConfirmOptions): Promise<boolean> {
    // A new question replaces any unanswered one
    this.requestSubject.value?.resolve(false);
    return new Promise(resolve => this.requestSubject.next({ ...options, resolve }));
  }

  /** Shortcut for the common "delete this item" confirmation. */
  delete(itemType: string, name?: string): Promise<boolean> {
    return this.ask({
      kicker: 'Please confirm',
      title: `Delete ${itemType}?`,
      message: `${name ? `“${name}”` : `This ${itemType}`} will be permanently removed. This can't be undone.`,
      confirmText: 'Delete'
    });
  }

  answer(confirmed: boolean): void {
    const request = this.requestSubject.value;
    if (!request) return;
    this.requestSubject.next(null);
    request.resolve(confirmed);
  }
}
