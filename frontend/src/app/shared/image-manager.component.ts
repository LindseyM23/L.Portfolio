import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PortfolioService } from '../services/portfolio.service';

/**
 * Admin control for a list of images: upload several at once,
 * reorder (first image is the cover) and remove.
 * Usage: <app-image-manager [(images)]="project.images"></app-image-manager>
 */
@Component({
  selector: 'app-image-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label>Slideshow images <span class="hint">(first image is the cover)</span></label>
    <div class="thumbs">
      <figure *ngFor="let src of images; let i = index; let first = first; let last = last" class="thumb">
        <img [src]="src" [alt]="'Image ' + (i + 1)" />
        <span class="num">{{ i + 1 }}</span>
        <div class="thumb-actions">
          <button type="button" (click)="move(i, -1)" [disabled]="first" aria-label="Move left">&#x2190;</button>
          <button type="button" (click)="move(i, 1)" [disabled]="last" aria-label="Move right">&#x2192;</button>
          <button type="button" class="danger" (click)="remove(i)" aria-label="Remove">✕</button>
        </div>
      </figure>

      <button type="button" class="add" (click)="fileInput.click()" [disabled]="uploading">
        <img src="assets/icons/camera.svg" alt="" class="ico-bg" />
        <span>{{ uploading ? 'Uploading…' : '+ Add images' }}</span>
      </button>
    </div>
    <input #fileInput type="file" accept="image/*" multiple hidden (change)="upload($event)" />
  `,
  styles: [`
    @import '../../theme.scss';
    :host { display: flex; flex-direction: column; gap: $spacing-xs; }
    label { @include mono-label; color: var(--muted); }
    .hint { text-transform: none; letter-spacing: 0; }
    .thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: $spacing-xs; }
    .thumb { position: relative; aspect-ratio: 4 / 3; border-radius: 10px; overflow: hidden; border: 1px solid var(--line); }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .num {
      position: absolute; top: 6px; left: 6px;
      min-width: 20px; height: 20px; padding: 0 6px;
      border-radius: $pill; background: $black; color: $white;
      font-family: $font-mono; font-size: 10px; line-height: 20px; text-align: center;
    }
    .thumb-actions {
      position: absolute; inset: auto 0 0 0;
      display: flex; justify-content: center; gap: 4px; padding: 6px;
      background: linear-gradient(transparent, rgba(10, 10, 10, 0.7));
    }
    .thumb-actions button {
      width: 24px; height: 24px; padding: 0; font-size: 11px;
      background: $white; color: $black; border-color: $white;
    }
    .thumb-actions button.danger:hover { background: $danger; border-color: $danger; color: $white; }
    .add {
      aspect-ratio: 4 / 3; height: auto; flex-direction: column; border-radius: 10px;
      background: transparent; color: var(--muted); border: 2px dashed var(--line); font-size: 12px;
    }
    .add:hover { border-color: var(--fg); color: var(--fg); background: transparent; }
    .add img { width: 20px; opacity: 0.6; }
  `]
})
export class ImageManagerComponent {
  @Input() images: string[] = [];
  @Output() imagesChange = new EventEmitter<string[]>();

  uploading = false;

  constructor(private portfolioService: PortfolioService) {}

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter(f => f.type.startsWith('image/'));
    input.value = '';
    if (!files.length) return;

    this.uploading = true;
    forkJoin(files.map(file => this.portfolioService.uploadFile(file))).subscribe({
      next: responses => {
        this.emit([...this.images, ...responses.map(r => `http://localhost:5001${r.url}`)]);
        this.uploading = false;
      },
      error: () => {
        this.uploading = false;
        alert('Failed to upload one or more images');
      }
    });
  }

  move(i: number, step: number): void {
    const next = [...this.images];
    [next[i], next[i + step]] = [next[i + step], next[i]];
    this.emit(next);
  }

  remove(i: number): void {
    this.emit(this.images.filter((_, idx) => idx !== i));
  }

  private emit(images: string[]): void {
    this.images = images;
    this.imagesChange.emit(images);
  }
}
