import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  private router = inject(Router);
  private authService = inject(AuthService);

  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptPrivacyPolicy: false,
  };

  nameError = '';
  emailError = '';
  passwordError = '';
  confirmPasswordError = '';
  privacyPolicyError = '';

  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  validateForm(): boolean {
    this.nameError = '';
    this.emailError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.privacyPolicyError = '';

    if (!this.form.name.trim()) {
      this.nameError = 'Please enter your name';
      return false;
    }
    if (!this.form.email) {
      this.emailError = 'Please enter your email';
      return false;
    }
    if (!this.isEmailValid(this.form.email)) {
      this.emailError = 'Please enter a valid email address';
      return false;
    }
    if (!this.form.password) {
      this.passwordError = 'Please enter a password';
      return false;
    }
    if (this.form.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
      return false;
    }
    if (this.form.confirmPassword !== this.form.password) {
      this.confirmPasswordError = 'Passwords do not match';
      return false;
    }
    if (!this.form.acceptPrivacyPolicy) {
      this.privacyPolicyError = 'Please accept the Privacy Policy';
      return false;
    }

    return true;
  }

  async signUp(): Promise<void> {
    if (!this.validateForm()) return;
    try {
      await this.authService.signUp(
        this.form.name.trim(),
        this.form.email.trim(),
        this.form.password
      );
      this.router.navigate(['/summary']);
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error);
    }
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }
}