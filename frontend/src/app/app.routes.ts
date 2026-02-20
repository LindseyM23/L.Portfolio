import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./pages/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  { 
    path: 'experience/:id', 
    loadComponent: () => import('./pages/experience-detail/experience-detail.component').then(m => m.ExperienceDetailComponent)
  },
  { path: '**', redirectTo: '' }
];
