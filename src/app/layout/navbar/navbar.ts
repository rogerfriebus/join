import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Hauptnavigation der App. Verlinkt die eingeloggten Bereiche.
 *
 * Die Links zu den geschützten Bereichen (Summary, Add Task, Board, Contacts)
 * werden nur für authentifizierte Nutzer angezeigt. Auf den öffentlichen Seiten
 * (Privacy Policy, Legal Notice) sieht ein nicht angemeldeter Nutzer den
 * Login-Einstieg und in der mobilen Navigation zusätzlich die rechtlichen Links,
 * aber keine Links in geschützte Bereiche. Der authGuard bleibt zusätzlich der
 * letzte Schutz. Das Brand-Logo führt für Gäste/Ausgeloggte bewusst zu /login.
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private authService = inject(AuthService);

  /** True, wenn ein Benutzer (inkl. Gast) eingeloggt ist. */
  readonly isAuthenticated = this.authService.isAuthenticated;
}
