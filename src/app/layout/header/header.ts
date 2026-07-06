import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Kopfzeile der App (innerhalb der Shell).
 *
 * Enthält das User-Menü: Der Avatar zeigt die Initialen des eingeloggten
 * Benutzers (bzw. "G" für Guest) und öffnet ein kleines Dropdown mit der
 * Logout-Aktion. Die Auth-Logik liegt ausschließlich im {@link AuthService};
 * der Header konsumiert nur dessen Signale und ruft `logout()` auf.
 */
@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private authService = inject(AuthService);
  private router = inject(Router);

  /** True, wenn ein Benutzer (inkl. Gast) eingeloggt ist. */
  readonly isAuthenticated = this.authService.isAuthenticated;

  /** Anzeigename des aktuellen Benutzers ("" wenn niemand eingeloggt). */
  readonly displayName = this.authService.displayName;

  /** Offen-Zustand des User-Dropdowns. */
  readonly menuOpen = signal(false);

  /**
   * Initialen aus dem Anzeigenamen (max. 2 Buchstaben), analog zur
   * Kontakt-Darstellung. Leerer String, wenn kein Name vorhanden ist.
   */
  readonly initials = computed(() => {
    const name = this.displayName().trim();
    if (!name) {
      return '';
    }
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  });

  /** Navigiert zur Help-Seite. */
  async openHelp(): Promise<void> {
    this.closeMenu();
    await this.router.navigate(['/help']);
  }

  /** Öffnet/schließt das User-Dropdown. */
  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  /** Schließt das User-Dropdown. */
  closeMenu(): void {
    this.menuOpen.set(false);
  }

  /** Loggt den Benutzer aus und navigiert zur Login-Seite. */
  async logout(): Promise<void> {
    this.closeMenu();
    this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
