import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthRedirectService } from '../../core/services/auth-redirect.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private authRedirect = inject(AuthRedirectService);

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

  // --- Live Validierung ---

  validateName(): void {
    if (!this.form.name.trim()) {
      this.nameError = 'Please enter your name';
    } else if (this.form.name.trim().length < 3) {
      this.nameError = 'Name must be at least 3 characters';
    } else {
      this.nameError = '';
    }
  }

  validateEmail(): void {
    if (!this.form.email) {
      this.emailError = 'Please enter your email';
    } else if (!this.isEmailValid(this.form.email)) {
      this.emailError = 'Please enter a valid email address';
    } else {
      this.emailError = '';
    }
  }

  validatePassword(): void {
    if (!this.form.password) {
      this.passwordError = 'Please enter a password';
    } else if (this.form.password.length < 8) {
      this.passwordError = 'Password must be at least 8 characters';
    } else if (!/\d/.test(this.form.password)) {
      this.passwordError = 'Password must contain at least one number';
    } else {
      this.passwordError = '';
    }
    // Confirm Password live neu prüfen wenn Passwort sich ändert
    if (this.form.confirmPassword) {
      this.validateConfirmPassword();
    }
  }

  validateConfirmPassword(): void {
    if (this.form.confirmPassword !== this.form.password) {
      this.confirmPasswordError = 'Passwords do not match';
    } else {
      this.confirmPasswordError = '';
    }
  }

  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  get isFormValid(): boolean {
    return (
      this.form.name.trim().length >= 3 &&
      this.isEmailValid(this.form.email) &&
      this.form.password.length >= 8 &&
      /\d/.test(this.form.password) &&
      this.form.confirmPassword === this.form.password &&
      this.form.acceptPrivacyPolicy
    );
  }

  validateForm(): boolean {
    this.validateName();
    this.validateEmail();
    this.validatePassword();
    this.validateConfirmPassword();

    if (!this.form.acceptPrivacyPolicy) {
      this.privacyPolicyError = 'Please accept the Privacy Policy';
    }

    return !this.nameError && !this.emailError && !this.passwordError && !this.confirmPasswordError && !this.privacyPolicyError;
  }

  async signUp(): Promise<void> {
    if (!this.validateForm()) return;
    try {
      await this.authService.signUp(
        this.form.name.trim(),
        this.form.email.trim(),
        this.form.password
      );
      const target = this.authRedirect.getRedirectUrlFromParams(
        this.route.snapshot.queryParamMap,
      );
      this.router.navigateByUrl(target);
    } catch (error) {
      this.emailError =
        error instanceof Error ? error.message : 'Registrierung fehlgeschlagen.';
    }
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }
}