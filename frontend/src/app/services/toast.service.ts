import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

/**
 * App-wide notifications, rendered by <app-toasts> in the app shell.
 *
 *   this.toast.success('Experience added');
 *   this.toast.error('Could not save', 'Please try again');
 *   if (!this.toast.require({ Role: exp.role, Company: exp.company })) return;
 *   ...subscribe({ error: err => this.toast.apiError(err, 'Could not save experience') })
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  success(title: string, message?: string): void {
    this.show('success', title, message, 3500);
  }

  error(title: string, message?: string): void {
    this.show('error', title, message, 6000);
  }

  info(title: string, message?: string): void {
    this.show('info', title, message, 4000);
  }

  /**
   * Checks required form values (keyed by their label). Shows one error
   * toast naming every empty field and returns false if any are missing.
   */
  require(fields: Record<string, unknown>): boolean {
    const missing = Object.entries(fields)
      .filter(([, value]) => value === null || value === undefined || String(value).trim() === '')
      .map(([label]) => label);
    if (missing.length) {
      this.error('Missing information', `Please fill in: ${missing.join(', ')}`);
      return false;
    }
    return true;
  }

  /** Shows an HTTP failure, preferring the backend's own error message. */
  apiError(err: unknown, title: string): void {
    let message = 'Something went wrong. Please try again.';
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) message = 'Could not reach the server. Is the backend running?';
      else if (err.status === 401) message = 'Your admin session has expired. Please log in again.';
      else if (err.error?.error) message = err.error.error;
    }
    this.error(title, message);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }

  private show(type: ToastType, title: string, message: string | undefined, duration: number): void {
    const toast: Toast = { id: ++this.nextId, type, title, message, duration };
    // Keep at most 4 on screen; the oldest drops off first
    this.toastsSubject.next([...this.toastsSubject.value.slice(-3), toast]);
    setTimeout(() => this.dismiss(toast.id), duration);
  }
}
