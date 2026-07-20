import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthRedirectService } from '../../core/services/auth-redirect.service';

/**
 * Login-Seite der Anwendung.
 *
 * Enthält das Login-Formular mit E-Mail und Passwort, einen Gast-Login sowie
 * eine Intro-Animation beim ersten Laden. Ist beim Aufruf bereits ein Benutzer
 * eingeloggt, wird er automatisch ausgeloggt.
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

  /** Aktueller Formularzustand. */
  form = {
    email: '',
    password: '',
  };

  /** Gibt an, ob das Passwort im Klartext angezeigt wird. */
  showPassword = false;

  /** Fehlermeldung für das E-Mail-Feld. */
  emailError = '';

  /** Fehlermeldung für das Passwort-Feld. */
  passwordError = '';

  /** Globale Fehlermeldung für fehlgeschlagenen Login (z. B. falsches Passwort). */
  loginError = '';

  /** Gibt an, ob die Logo-Animation noch läuft. */
  logoAnimating = true;

  /** Gibt an, ob die Intro-Animation abgeschlossen ist. */
  introComplete = false;

  /**
   * Initialisiert die Login-Seite.
   * Loggt einen ggf. noch eingeloggten Benutzer aus und steuert die Intro-Animation.
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

  /** Schaltet die Passwort-Sichtbarkeit um. */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /** Prüft, ob die eingegebene E-Mail-Adresse dem erwarteten Format entspricht. */
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validiert das Formular und setzt alle Fehlermeldungen zurück.
   * Gibt true zurück, wenn alle Felder valide sind.
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

  /** Meldet den Benutzer mit E-Mail und Passwort an und navigiert bei Erfolg weiter. */
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

  /** Meldet den Benutzer als Gast an und navigiert weiter. */
  async guestLogin(): Promise<void> {
    await this.authService.loginAsGuest();
    this.redirectAfterAuth();
  }

  /** Navigiert nach erfolgreicher Authentifizierung zum gespeicherten Ziel. */
  private redirectAfterAuth(): void {
    const target = this.authRedirect.getRedirectUrlFromParams(
      this.route.snapshot.queryParamMap,
    );
    this.router.navigateByUrl(target);
  }

  /** Navigiert zur Registrierungsseite. */
  goToSignUp(): void {
    this.router.navigate(['/sign-up']);
  }
}