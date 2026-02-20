import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { About, Skill } from '../../models/portfolio.models';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit {
  isAdmin = false;
  about: About = { overview: '' };
  skills: Skill[] = [];
  editingAbout = false;
  addingSkill = false;
  newSkill: Skill = { name: '', order: 0 };
  skillIconPreview: string | null = null;
  skillIconFile: File | null = null;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.loadData();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadData(): void {
    this.portfolioService.getAbout().subscribe(about => this.about = about);
    this.portfolioService.getSkills().subscribe(skills => this.skills = skills);
  }

  saveAbout(): void {
    this.portfolioService.updateAbout(this.about).subscribe(() => {
      this.editingAbout = false;
      this.loadData();
    });
  }

  addSkill(): void {
    // If there's an icon file, upload it first
    if (this.skillIconFile) {
      this.portfolioService.uploadFile(this.skillIconFile).subscribe({
        next: (response) => {
          this.newSkill.icon = `http://localhost:5001${response.url}`;
          this.createSkill();
        },
        error: () => {
          alert('Failed to upload icon');
        }
      });
    } else {
      this.createSkill();
    }
  }

  private createSkill(): void {
    this.portfolioService.createSkill(this.newSkill).subscribe(() => {
      this.loadData();
      this.cancelAddSkill();
    });
  }

  onSkillIconUpload(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      this.skillIconFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.skillIconPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an SVG file');
    }
  }

  clearSkillIcon(): void {
    this.skillIconFile = null;
    this.skillIconPreview = null;
    this.newSkill.icon = undefined;
  }

  cancelAddSkill(): void {
    this.addingSkill = false;
    this.newSkill = { name: '', order: 0 };
    this.clearSkillIcon();
  }

  deleteSkill(id: number): void {
    if (confirm('Delete this skill?')) {
      this.portfolioService.deleteSkill(id).subscribe(() => this.loadData());
    }
  }
}
