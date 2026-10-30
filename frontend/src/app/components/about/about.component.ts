import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { About, Skill } from '../../models/portfolio.models';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective],
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
  @ViewChild('statement') statement?: ElementRef<HTMLElement>;
  scrollable = false;
  atTop = true;
  atBottom = true;

  stats = [
    { label: 'Years building', value: 0, suffix: '+' },
    { label: 'Roles held', value: 0, suffix: '' },
    { label: 'Certifications', value: 0, suffix: '×' },
    { label: 'Core skills', value: 0, suffix: '' }
  ];

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.loadData();
    this.portfolioService.adminMode$.subscribe(mode => this.isAdmin = mode);
  }

  loadData(): void {
    this.portfolioService.getAbout().subscribe(about => {
      this.about = about;
      setTimeout(() => this.updateScrollState());
    });
    this.portfolioService.getSkills().subscribe(skills => {
      this.skills = skills;
      this.stats[3].value = skills.length;
    });
    this.portfolioService.getExperience().subscribe(exps => {
      const earliest = Math.min(...exps.map(e => new Date(e.start_date).getTime()));
      this.stats[0].value = exps.length ? new Date().getFullYear() - new Date(earliest).getFullYear() : 0;
      this.stats[1].value = exps.length;
    });
    this.portfolioService.getCertifications().subscribe(certs => this.stats[2].value = certs.length);
  }

  @HostListener('window:resize')
  updateScrollState(): void {
    const el = this.statement?.nativeElement;
    if (!el) return;
    this.scrollable = el.scrollHeight > el.clientHeight + 1;
    this.atTop = el.scrollTop <= 1;
    this.atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
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
