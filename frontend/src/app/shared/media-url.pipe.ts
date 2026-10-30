import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Turns a stored image path (e.g. "/api/media/<id>") into a full URL on the
 * API server for the current environment. Absolute and data: URLs pass through.
 *
 *   <img [src]="project.image | mediaUrl" />
 */
@Pipe({ name: 'mediaUrl', standalone: true })
export class MediaUrlPipe implements PipeTransform {
  transform(path: string | null | undefined): string {
    if (!path) return '';
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    return `${environment.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
