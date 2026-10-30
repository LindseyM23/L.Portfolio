import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { SocialLink, About } from '../../models/portfolio.models';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { ModalComponent } from '../../shared/modal.component';
import { MediaUrlPipe } from '../../shared/media-url.pipe';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, MediaUrlPipe],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit {
  isAdmin = false;
  socialLinks: SocialLink[] = [];
  about: About = { overview: '', profile_image: '' };
  
  // Edit modes
  editingAbout = false;
  editingLink: number | null = null;
  addingLink = false;
  
  // Form data
  newLink: SocialLink = { platform: '', url: '', order: 0 };
  uploadingImage = false;
  year = new Date().getFullYear();
  location = '';
  
  // Typewriter effect
  typedText = '';
  titles = [
    'Full-Stack Developer',
    '3X AWS Certified Solutions Architect',
    'Cloud Developer',
    'SEO Specialist',
  ];
  private currentTitleIndex = 0;
  private currentCharIndex = 0;
  private isDeleting = false;
  private typeSpeed = 100; // milliseconds per character
  private deleteSpeed = 50;
  private pauseAfterType = 2000; // pause before deleting
  private pauseAfterDelete = 500; // pause before typing next

  constructor(
    private portfolioService: PortfolioService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.portfolioService.adminMode$.subscribe(mode => {
      this.isAdmin = mode;
    });
    this.startTypewriter();
  }
  
  private startTypewriter(): void {
    this.typeWriter();
  }
  
  private typeWriter(): void {
    const currentTitle = this.titles[this.currentTitleIndex];
    
    if (!this.isDeleting && this.currentCharIndex <= currentTitle.length) {
      // Typing
      this.typedText = currentTitle.substring(0, this.currentCharIndex);
      this.currentCharIndex++;
      
      if (this.currentCharIndex > currentTitle.length) {
        // Finished typing, pause then start deleting
        setTimeout(() => {
          this.isDeleting = true;
          this.typeWriter();
        }, this.pauseAfterType);
      } else {
        setTimeout(() => this.typeWriter(), this.typeSpeed);
      }
    } else if (this.isDeleting && this.currentCharIndex >= 0) {
      // Deleting
      this.typedText = currentTitle.substring(0, this.currentCharIndex);
      this.currentCharIndex--;
      
      if (this.currentCharIndex < 0) {
        // Finished deleting, move to next title
        this.isDeleting = false;
        this.currentTitleIndex = (this.currentTitleIndex + 1) % this.titles.length;
        this.currentCharIndex = 0;
        
        setTimeout(() => this.typeWriter(), this.pauseAfterDelete);
      } else {
        setTimeout(() => this.typeWriter(), this.deleteSpeed);
      }
    }
  }

  loadData(): void {
    this.portfolioService.getSocialLinks().subscribe(links => {
      this.socialLinks = links;
    });
    this.portfolioService.getAbout().subscribe(about => {
      this.about = about;
    });
    this.portfolioService.getContact().subscribe(contact => {
      this.location = contact.location ?? '';
    });
  }

  onImageUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Unsupported file', 'Please choose an image file.');
      return;
    }
    this.uploadingImage = true;
    this.portfolioService.uploadFile(file).subscribe({
      next: (response) => {
        this.about.profile_image = response.url;
        this.saveAbout();
        this.uploadingImage = false;
      },
      error: err => {
        this.uploadingImage = false;
        this.toast.apiError(err, 'Could not upload photo');
      }
    });
  }

  saveAbout(): void {
    this.portfolioService.updateAbout(this.about).subscribe({
      next: () => {
        this.editingAbout = false;
        this.toast.success('Photo updated');
      },
      error: err => this.toast.apiError(err, 'Could not save photo')
    });
  }

  addLink(): void {
    if (!this.toast.require({ Platform: this.newLink.platform, URL: this.newLink.url })) return;
    if (!/^(https:\/\/|mailto:)/i.test(this.newLink.url.trim())) {
      this.toast.error('Check the URL', 'Links should start with https:// (or mailto: for email).');
      return;
    }
    this.portfolioService.createSocialLink(this.newLink).subscribe({
      next: () => {
        this.loadData();
        this.addingLink = false;
        this.newLink = { platform: '', url: '', order: 0 };
        this.toast.success('Social link added');
      },
      error: err => this.toast.apiError(err, 'Could not add social link')
    });
  }

  updateLink(link: SocialLink): void {
    if (link.id) {
      this.portfolioService.updateSocialLink(link.id, link).subscribe(() => {
        this.editingLink = null;
        this.loadData();
      });
    }
  }

  async deleteLink(id: number): Promise<void> {
    if (!(await this.confirm.delete('social link', this.socialLinks.find(l => l.id === id)?.platform))) return;
    this.portfolioService.deleteSocialLink(id).subscribe({
      next: () => {
        this.loadData();
        this.toast.success('Social link deleted');
      },
      error: err => this.toast.apiError(err, 'Could not delete social link')
    });
  }

  getPlatformIcon(platform: string): string {
    const icons: any = {
      'github': '/assets/icons/logo-github.svg',
      'linkedin': '/assets/icons/linkedin.svg',
      'tiktok': '/assets/icons/tiktok-logo.svg',
      'instagram': '/assets/icons/instagram-logo.svg',
      'cv': '/assets/icons/curriculum-portfolio.svg',
    };
    const iconPath = icons[platform.toLowerCase()] || '/assets/icons/logo-github.svg';
    return iconPath;
  }

  onImageError(event: any): void {
    console.error('Failed to load icon:', event.target.src);
    event.target.style.display = 'none';
  }
}
