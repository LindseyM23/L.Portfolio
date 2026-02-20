import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { AboutComponent } from '../../components/about/about.component';
import { ServicesComponent } from '../../components/services/services.component';
import { CertificationsComponent } from '../../components/certifications/certifications.component';
import { ExperienceComponent } from '../../components/experience/experience.component';
import { ProjectsComponent } from '../../components/projects/projects.component';
import { KpisComponent } from '../../components/kpis/kpis.component';
import { ContactComponent } from '../../components/contact/contact.component';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    HeroComponent,
    AboutComponent,
    ServicesComponent,
    CertificationsComponent,
    ExperienceComponent,
    ProjectsComponent,
    KpisComponent,
    ContactComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  isAdmin = false;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.portfolioService.adminMode$.subscribe(mode => {
      this.isAdmin = mode;
    });
  }
}
