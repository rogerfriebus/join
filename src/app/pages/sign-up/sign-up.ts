import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthRedirectService } from '../../core/services/auth-redirect.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      const target = this.authRedirect.getRedirectUrlFromParams(
        this.route.snapshot.queryParamMap,
      );
      this.router.navigateByUrl(target);
    } catch (error) {
      // Häufigster Fall: E-Mail bereits registriert – am E-Mail-Feld anzeigen.
      this.emailError =
        error instanceof Error ? error.message : 'Registrierung fehlgeschlagen.';
    }
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }
}