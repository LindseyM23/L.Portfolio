import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

/**
 * Fades + lifts an element into view the first time it enters the viewport.
 * Usage: <div appReveal [revealDelay]="0.1">…</div>
 */
@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const node = this.el.nativeElement;
    node.classList.add('reveal');
    node.style.setProperty('--reveal-delay', `${this.revealDelay}s`);

    if (!('IntersectionObserver' in window)) {
      node.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          node.classList.add('is-visible');
          this.observer?.disconnect();
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
