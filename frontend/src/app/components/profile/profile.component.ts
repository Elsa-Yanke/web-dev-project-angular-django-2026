import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ProfileService } from '../../services/profile.service';
import { LibraryEntry } from '../../models/game.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  profile = signal<any>(null);
  favorites = signal<LibraryEntry[]>([]);
  editingBio = signal(false);
  bioText = signal('');
  saving = signal(false);
  avatarPreview = signal<string | null>(null);
  private pendingAvatar: File | null = null;

  constructor(private api: ApiService, public profileService: ProfileService) {}

  ngOnInit(): void {
    this.load();
    this.api.getLibrary().subscribe(entries => {
      this.favorites.set(entries.filter(e => e.is_favorite));
    });
  }

  load(): void {
    this.profileService.reload();
    this.api.getMe().subscribe((data: any) => {
      this.profile.set(data);
      this.bioText.set(data.bio || '');
    });
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pendingAvatar = file;
    const reader = new FileReader();
    reader.onload = e => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  saveProfile(): void {
    this.saving.set(true);
    const fd = new FormData();
    fd.append('bio', this.bioText());
    if (this.pendingAvatar) fd.append('avatar', this.pendingAvatar);
    this.profileService.update(fd).then((data) => {
      this.profile.set(data);
      this.editingBio.set(false);
      this.saving.set(false);
      this.pendingAvatar = null;
      this.avatarPreview.set(null);
    }).catch(() => this.saving.set(false));
  }

  cancelEdit(): void {
    this.editingBio.set(false);
    this.bioText.set(this.profileService.bio());
    this.avatarPreview.set(null);
    this.pendingAvatar = null;
  }

  coverSrc(entry: LibraryEntry): string {
    return entry.game.cover_image ? `covers/${entry.game.cover_image}` : '';
  }
}
