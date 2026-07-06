import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthRedirectService } from '../../core/services/auth-redirect.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Login-Seite (Einstieg der SPA).
 *
 * TODO (Sprint 1+): Login-Formular, Registrierung und Validierung ergänzen.
 * Gast-Login und eingeloggte User nutzen laut Kursvorgabe denselben Datenbestand.
 */
@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authRedirectService = inject(AuthRedirectService);

  /** Meldet den Nutzer als Gast an und öffnet danach die gewünschte App-Seite. */
  async loginAsGuest(): Promise<void> {
    await this.authService.loginAsGuest();
    await this.router.navigateByUrl(this.getRedirectUrl());
  }

  /** Liefert das sichere Ziel nach erfolgreichem Gast-Login. */
  private getRedirectUrl(): string {
    return this.authRedirectService.getRedirectUrlFromParams(this.route.snapshot.queryParamMap);
  }
}
