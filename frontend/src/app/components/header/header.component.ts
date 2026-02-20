import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  isAdmin = false;
  isScrolled = false;

  navLinks = [
    { label: 'About Me', target: 'about' },
    { label: 'Services', target: 'services' },
    { label: 'Certs & Badges', target: 'certifications' },
    { label: 'Experience', target: 'experience' },
    { label: 'Portfolio', target: 'portfolio' },
    { label: 'KPIs', target: 'kpis' },
    { label: 'Contact', target: 'contact' }
  ];

  constructor(
    private portfolioService: PortfolioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.portfolioService.adminMode$.subscribe(mode => {
      this.isAdmin = mode;
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  scrollTo(target: string): void {
    const element = document.getElementById(target);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  logout(): void {
    this.portfolioService.logout();
    this.router.navigate(['/']);
  }
}
