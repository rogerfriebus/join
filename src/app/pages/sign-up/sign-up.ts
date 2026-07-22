import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthRedirectService } from '../../core/services/auth-redirect.service';


/**
 * Registration page of the application.
 *
 * Contains the sign-up form with name, email, password, and
 * privacy policy confirmation. Validates all fields live and
 * during submission. If a user is already logged in when opening
 * the page, the user is automatically logged out.
 */
@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private authRedirect = inject(AuthRedirectService);

  /** Current form state. */
  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptPrivacyPolicy: false,
  };

  /** Error message for the name field. */
  nameError = '';

  /** Error message for the email field. */
  emailError = '';

  /** Error message for the password field. */
  passwordError = '';

  /** Error message for the password confirmation field. */
  confirmPasswordError = '';

  /** Error message for the privacy policy checkbox. */
  privacyPolicyError = '';

  /** Indicates whether the password is displayed as plain text. */
  showPassword = false;

  /** Toggles password visibility. */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Automatically logs out an already authenticated user
   * when opening the registration page.
   */
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.logout();
    }
  }

  /** Validates the name field live and updates the corresponding error message. */
  validateName(): void {
    if (!this.form.name.trim()) {
      this.nameError = 'Please enter your name';
    } else if (this.form.name.trim().length < 3) {
      this.nameError = 'Name must be at least 3 characters.';
    } else {
      this.nameError = '';
    }
  }

  /** Validates the email field live and updates the corresponding error message. */
  validateEmail(): void {
    if (!this.form.email) {
      this.emailError = 'Please enter your email';
    } else if (!this.isEmailValid(this.form.email)) {
      this.emailError = 'Please enter a valid email address.';
    } else {
      this.emailError = '';
    }
  }

  /**
   * Validates the password field live and updates the corresponding error message.
   * Also triggers confirmation validation if the confirmation field is already filled.
   */
  validatePassword(): void {
    if (!this.form.password) {
      this.passwordError = 'Please enter a password';
    } else if (this.form.password.length < 8) {
      this.passwordError = 'Password must be at least 8 characters.';
    } else if (!/\d/.test(this.form.password)) {
      this.passwordError = 'Password must contain at least one number.';
    } else {
      this.passwordError = '';
    }

    if (this.form.confirmPassword) {
      this.validateConfirmPassword();
    }
  }

  /** Validates the password confirmation field live and updates the corresponding error message. */
  validateConfirmPassword(): void {
    if (this.form.confirmPassword !== this.form.password) {
      this.confirmPasswordError = 'Passwords do not match.';
    } else {
      this.confirmPasswordError = '';
    }
  }

  /** Checks whether the entered email address matches the expected format. */
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Returns true if all form fields are valid and the
   * privacy policy has been accepted.
   */
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

  /**
   * Performs a complete form validation and updates all
   * error messages. Returns true if the form is valid.
   */
  validateForm(): boolean {
    this.validateName();
    this.validateEmail();
    this.validatePassword();
    this.validateConfirmPassword();

    if (!this.form.acceptPrivacyPolicy) {
      this.privacyPolicyError = 'Please accept the Privacy Policy.';
    }

    return (
      !this.nameError &&
      !this.emailError &&
      !this.passwordError &&
      !this.confirmPasswordError &&
      !this.privacyPolicyError
    );
  }

  /**
   * Registers the user and navigates to the stored destination on success.
   * Sets the email error message if registration fails.
   */
  async signUp(): Promise<void> {
    if (!this.validateForm()) return;

    try {
      await this.authService.signUp(
        this.form.name.trim(),
        this.form.email.trim(),
        this.form.password,
      );

      const target = this.authRedirect.getRedirectUrlFromParams(
        this.route.snapshot.queryParamMap,
      );

      this.router.navigateByUrl(target);
    } catch (error) {
      this.emailError =
        error instanceof Error ? error.message : 'Registration failed.';
    }
  }

  /** Navigates back to the login page. */
  goBack(): void {
    this.router.navigate(['/login']);
  }
}