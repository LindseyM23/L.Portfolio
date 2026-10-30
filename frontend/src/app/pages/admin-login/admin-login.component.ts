import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  password: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(
    private portfolioService: PortfolioService,
    private router: Router
  ) {}

  login(): void {
    if (!this.password) {
      this.error = 'Please enter password';
      return;
    }

    this.loading = true;
    this.error = '';

    this.portfolioService.login(this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Invalid password';
      }
    });
  }
}
