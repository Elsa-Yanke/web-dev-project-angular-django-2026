import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  mode = signal<'login' | 'register'>('login');

  // Two-way bound with [(ngModel)]
  loginUsername = '';
  loginPassword = '';
  loginError = signal('');

  regUsername = '';
  regEmail = '';
  regPassword = '';
  regPassword2 = '';
  regError = signal('');
  regSuccess = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  switchMode(m: 'login' | 'register') {
    this.mode.set(m);
    this.loginError.set('');
    this.regError.set('');
    this.regSuccess.set('');
  }

  login(): void {
    this.loginError.set('');
    if (!this.loginUsername || !this.loginPassword) {
      this.loginError.set('Please fill in all fields.');
      return;
    }
    this.auth.login(this.loginUsername, this.loginPassword).subscribe({
      next: () => this.router.navigate(['/games']),
      error: (err) => {
        this.loginError.set(
          err.status === 401
            ? 'Invalid username or password.'
            : 'Error. Is the backend running?'
        );
      }
    });
  }

  register(): void {
    this.regError.set('');
    this.regSuccess.set('');
    const username = this.regUsername;
    const email = this.regEmail;
    const password = this.regPassword;
    const password2 = this.regPassword2;

    if (!username || !email || !password || !password2) {
      this.regError.set('Please fill in all fields.');
      return;
    }
    if (password !== password2) {
      this.regError.set('Passwords do not match.');
      return;
    }
    this.auth.register({ username, email, password, password2 }).subscribe({
      next: () => this.router.navigate(['/games']),
      error: (err) => {
        const data = err.error;
        if (data?.username) this.regError.set('Username: ' + data.username[0]);
        else if (data?.email) this.regError.set('Email: ' + data.email[0]);
        else if (data?.password2) this.regError.set(data.password2[0]);
        else this.regError.set('Registration failed. Try again.');
      }
    });
  }
}
