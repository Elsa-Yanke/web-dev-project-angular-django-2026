import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  avatarUrl = signal<string | null>(null);
  bio = signal<string>('');

  constructor(private api: ApiService, private auth: AuthService) {
    if (this.auth.isLoggedIn()) {
      this.reload();
    }
  }

  reload(): void {
    this.api.getMe().subscribe((data: any) => {
      this.avatarUrl.set(data.avatar_url || null);
      this.bio.set(data.bio || '');
    });
  }

  update(formData: FormData): Promise<any> {
    return new Promise((resolve, reject) => {
      this.api.updateProfile(formData).subscribe({
        next: (data) => {
          this.avatarUrl.set(data.avatar_url || null);
          this.bio.set(data.bio || '');
          resolve(data);
        },
        error: reject,
      });
    });
  }
}
