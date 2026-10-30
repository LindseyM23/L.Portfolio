import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PortfolioService } from './services/portfolio.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Lindsey\'s Portfolio';
  isAdminMode = false;

  constructor(private portfolioService: PortfolioService) {}

  // Open the native calendar when a date field is clicked anywhere, not just on its icon
  @HostListener('document:click', ['$event'])
  openDatePicker(event: MouseEvent): void {
    const target = event.target as HTMLInputElement;
    if (target?.tagName === 'INPUT' && target.type === 'date' && !target.disabled) {
      try { target.showPicker?.(); } catch { /* not supported or not user-activated */ }
    }
  }

  ngOnInit(): void {
    this.portfolioService.adminMode$.subscribe(mode => {
      this.isAdminMode = mode;
    });
  }
}
