import { Component, OnInit } from '@angular/core';
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

  ngOnInit(): void {
    this.portfolioService.adminMode$.subscribe(mode => {
      this.isAdminMode = mode;
    });
  }
}
