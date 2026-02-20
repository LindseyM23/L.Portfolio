import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  message: string = '';
  loading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchMessage();
  }

  fetchMessage(): void {
    this.loading = true;
    this.http.get<{ message: string }>(`${environment.apiUrl}/api/hello`)
      .subscribe({
        next: (response) => {
          this.message = response.message;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching message:', error);
          this.message = 'Welcome to Lindsey\'s Portfolio!';
          this.loading = false;
        }
      });
  }
}
