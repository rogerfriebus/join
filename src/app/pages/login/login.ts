import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private router = inject(Router);
  private authService = inject(AuthService);

  form = {
    email: '',
    password: '',
  };

  emailError = '';
  passwordError = '';

  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  validateForm(): boolean {
    this.emailError = '';
    this.passwordError = '';

    if (!this.form.email) {
      this.emailError = 'Please enter your email';
      return false;
    }
    if (!this.isEmailValid(this.form.email)) {
      this.emailError = 'Please enter a valid email address';
      return false;
    }
    if (!this.form.password) {
      this.passwordError = 'Please enter your password';
      return false;
    }

    return true;
  }

  async login(): Promise<void> {
    if (!this.validateForm()) return;
    await this.authService.login(this.form.email, this.form.password);
    this.router.navigate(['/summary']);
  }

  async guestLogin() {
    await this.authService.loginAsGuest();
    this.router.navigate(['/summary']);
  }

  goToSignUp(): void {
    this.router.navigate(['/sign-up']);
  }
}