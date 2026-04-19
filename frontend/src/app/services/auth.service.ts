import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private ACCESS_KEY  = 'jwt_access';
  private REFRESH_KEY = 'jwt_refresh';
  private USERNAME_KEY = 'username';

  constructor(private api: ApiService, private router: Router) {}

  login(username: string, password: string) {
    return this.api.login(username, password).pipe(
      tap(tokens => {
        localStorage.setItem(this.ACCESS_KEY,  tokens.access);
        localStorage.setItem(this.REFRESH_KEY, tokens.refresh);
        // SimpleJWT doesn't return username by default, so we save what was typed
        localStorage.setItem(this.USERNAME_KEY, username);
      })
    );
  }

  register(payload: { username: string; email: string; password: string; password2: string }) {
    return this.api.register(payload).pipe(
      tap(tokens => {
        localStorage.setItem(this.ACCESS_KEY,  tokens.access);
        localStorage.setItem(this.REFRESH_KEY, tokens.refresh);
        localStorage.setItem(this.USERNAME_KEY, payload.username);
      })
    );
  }

  logout(): void {
    const refresh = this.getRefreshToken();
    if (refresh) {
      this.api.logout(refresh).subscribe({ error: () => {} });
    }
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  getUsername(): string {
    return localStorage.getItem(this.USERNAME_KEY) ?? '';
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}
