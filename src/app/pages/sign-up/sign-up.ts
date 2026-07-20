import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthRedirectService } from '../../core/services/auth-redirect.service';

/**
 * Registrierungsseite der Anwendung.
 *
 * Enthält das Sign-up-Formular mit Name, E-Mail, Passwort und
 * Datenschutz-Zustimmung. Validiert alle Felder live und beim Absenden.
 * Ist beim Aufruf bereits ein Benutzer eingeloggt, wird er automatisch
 * ausgeloggt.
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

  /** Aktueller Formularzustand. */
  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptPrivacyPolicy: false,
  };

  /** Fehlermeldung für das Name-Feld. */
  nameError = '';

  /** Fehlermeldung für das E-Mail-Feld. */
  emailError = '';

  /** Fehlermeldung für das Passwort-Feld. */
  passwordError = '';

  /** Fehlermeldung für das Passwort-Bestätigung-Feld. */
  confirmPasswordError = '';

  /** Fehlermeldung für die Datenschutz-Checkbox. */
  privacyPolicyError = '';

  /** Gibt an, ob das Passwort im Klartext angezeigt wird. */
  showPassword = false;

  /** Schaltet die Passwort-Sichtbarkeit um. */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Loggt einen ggf. noch eingeloggten Benutzer beim Aufrufen der
   * Registrierungsseite automatisch aus.
   */
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.logout();
    }
  }

  /** Validiert das Name-Feld live und setzt die zugehörige Fehlermeldung. */
  validateName(): void {
    if (!this.form.name.trim()) {
      this.nameError = 'Please enter your name';
    } else if (this.form.name.trim().length < 3) {
      this.nameError = 'Name must be at least 3 characters.';
    } else {
      this.nameError = '';
    }
  }

  /** Validiert das E-Mail-Feld live und setzt die zugehörige Fehlermeldung. */
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
   * Validiert das Passwort-Feld live und setzt die zugehörige Fehlermeldung.
   * Löst bei bereits befülltem Bestätigungsfeld auch dessen Validierung aus.
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

  /** Validiert das Passwort-Bestätigung-Feld live und setzt die zugehörige Fehlermeldung. */
  validateConfirmPassword(): void {
    if (this.form.confirmPassword !== this.form.password) {
      this.confirmPasswordError = 'Passwords do not match.';
    } else {
      this.confirmPasswordError = '';
    }
  }

  /** Prüft, ob die eingegebene E-Mail-Adresse dem erwarteten Format entspricht. */
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Gibt true zurück, wenn alle Formularfelder valide und die
   * Datenschutz-Richtlinie akzeptiert wurde.
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
   * Führt eine vollständige Formularvalidierung durch und setzt alle
   * Fehlermeldungen. Gibt true zurück, wenn das Formular fehlerfrei ist.
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
   * Registriert den Benutzer und navigiert bei Erfolg zum gespeicherten Ziel.
   * Setzt bei fehlgeschlagener Registrierung die E-Mail-Fehlermeldung.
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

  /** Navigiert zurück zur Login-Seite. */
  goBack(): void {
    this.router.navigate(['/login']);
  }
}