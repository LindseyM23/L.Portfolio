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
  editingSkill: number | null = null;
  newSkill: Skill = { name: '', order: 0 };
  editSkillData: Skill = { name: '', order: 0 };
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
    if (file) {
      // Accept SVG files by extension or MIME type
      const isSvg = file.name.toLowerCase().endsWith('.svg') || 
                    file.type === 'image/svg+xml' ||
                    file.type === 'image/svg';
      
      if (isSvg) {
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

  startEditSkill(skill: Skill): void {
    this.editingSkill = skill.id!;
    this.editSkillData = { ...skill };
  }

  saveSkillEdit(): void {
    if (this.editingSkill && this.editSkillData.name.trim()) {
      this.portfolioService.updateSkill(this.editingSkill, this.editSkillData).subscribe(() => {
        this.loadData();
        this.cancelEditSkill();
      });
    }
  }

  cancelEditSkill(): void {
    this.editingSkill = null;
    this.editSkillData = { name: '', order: 0 };
  }

  deleteSkill(id: number): void {
    if (confirm('Delete this skill?')) {
      this.portfolioService.deleteSkill(id).subscribe(() => this.loadData());
    }
  }
}
