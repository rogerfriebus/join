import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthRedirectService } from '../../core/services/auth-redirect.service';


/**
 * Login page of the application.
 *
 * Contains the login form with email and password, a guest login option,
 * and an intro animation on the first load. If a user is already logged in
 * when opening the page, the user is automatically logged out.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private authRedirect = inject(AuthRedirectService);
  private cdr = inject(ChangeDetectorRef);

  /** Current form state. */
  form = {
    email: '',
    password: '',
  };

  /** Indicates whether the password is displayed as plain text. */
  showPassword = false;

  /** Error message for the email field. */
  emailError = '';

  /** Error message for the password field. */
  passwordError = '';

  /** Global error message for failed login attempts (e.g. incorrect password). */
  loginError = '';

  /** Indicates whether the logo animation is still running. */
  logoAnimating = true;

  /** Indicates whether the intro animation has been completed. */
  introComplete = false;

  /**
   * Initializes the login page.
   * Logs out an already authenticated user and controls the intro animation.
   */
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.logout();
    }

    setTimeout(() => {
      this.logoAnimating = false;
      this.cdr.detectChanges();
    }, 300);

    setTimeout(() => {
      this.introComplete = true;
      this.cdr.detectChanges();
    }, 1000);
  }

  /** Toggles password visibility. */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /** Checks whether the entered email address matches the expected format. */
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validates the form and resets all error messages.
   * Returns true if all fields are valid.
   */
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

  /** Logs in the user with email and password and redirects on success. */
  async login(): Promise<void> {
    if (!this.validateForm()) return;

    try {
      await this.authService.login(this.form.email, this.form.password);
      this.redirectAfterAuth();
    } catch (error) {
      this.loginError =
        error instanceof Error ? error.message : 'Email or password is incorrect.';
      this.cdr.detectChanges();
    }
  }

  /** Logs in the user as a guest and redirects afterwards. */
  async guestLogin(): Promise<void> {
    await this.authService.loginAsGuest();
    this.redirectAfterAuth();
  }

  /** Navigates to the stored destination after successful authentication. */
  private redirectAfterAuth(): void {
    const target = this.authRedirect.getRedirectUrlFromParams(
      this.route.snapshot.queryParamMap,
    );
    this.router.navigateByUrl(target);
  }

  /** Navigates to the registration page. */
  goToSignUp(): void {
    this.router.navigate(['/sign-up']);
  }
}