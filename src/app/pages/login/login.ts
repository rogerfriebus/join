import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthRedirectService } from '../../core/services/auth-redirect.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private authRedirect = inject(AuthRedirectService);
  private cdr = inject(ChangeDetectorRef);

  form = {
    email: '',
    password: '',
  };

  emailError = '';
  passwordError = '';
  /** Globale Fehlermeldung für fehlgeschlagenen Login (z. B. falsches Passwort). */
  loginError = '';

  logoAnimating = true;
  introComplete = false;

  ngOnInit(): void {

    setTimeout(() => {
      this.logoAnimating = false;
      this.cdr.detectChanges();
    }, 300);

    setTimeout(() => {
      this.introComplete = true;
      this.cdr.detectChanges();
    }, 1000);
  }

  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  validateForm(): boolean {
    this.emailError = '';
    this.passwordError = '';
    this.loginError = '';

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
    try {
      await this.authService.login(this.form.email, this.form.password);
      this.redirectAfterAuth();
    } catch (error) {
      this.loginError =
        error instanceof Error ? error.message : 'E-Mail oder Passwort ist falsch.';
      this.cdr.detectChanges();
    }
  }

  async guestLogin() {
    await this.authService.loginAsGuest();
    this.redirectAfterAuth();
  }

  /** Navigiert nach erfolgreicher Authentifizierung zum sicheren Ziel. */
  private redirectAfterAuth(): void {
    const target = this.authRedirect.getRedirectUrlFromParams(
      this.route.snapshot.queryParamMap,
    );
    this.router.navigateByUrl(target);
  }

  goToSignUp(): void {
    this.router.navigate(['/sign-up']);
  }
}
