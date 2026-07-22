import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Application header displayed inside the shell.
 *
 * Contains the Help button and user menu. The avatar displays the authenticated
 * user's initials, or "G" for a guest. The dropdown provides Help, Legal Notice,
 * Privacy Policy, and logout actions.
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

  /** Indicates whether a user, including a guest, is authenticated. */
  readonly isAuthenticated = this.authService.isAuthenticated;

  /** Display name of the current user, or an empty string when logged out. */
  readonly displayName = this.authService.displayName;

  /** Tracks whether the user dropdown is open. */
  readonly menuOpen = signal(false);

  /**
   * Builds up to two initials from the display name, matching contact avatars.
   * Returns an empty string when no display name is available.
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

  /** Navigates to the Help page. */
  async openHelp(): Promise<void> {
    await this.openPage('/help');
  }

  /** Navigates to the Legal Notice page. */
  async openLegalNotice(): Promise<void> {
    await this.openPage('/legal-notice');
  }

  /** Navigates to the Privacy Policy page. */
  async openPrivacyPolicy(): Promise<void> {
    await this.openPage('/privacy-policy');
  }

  /** Toggles the user dropdown. */
  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  /** Closes the user dropdown. */
  closeMenu(): void {
    this.menuOpen.set(false);
  }

  /** Logs out the current user and navigates to the login page. */
  async logout(): Promise<void> {
    this.closeMenu();
    this.authService.logout();
    await this.router.navigate(['/login']);
  }

  /** Closes the menu and then navigates to the provided route. */
  private async openPage(route: string): Promise<void> {
    this.closeMenu();
    await this.router.navigate([route]);
  }
}
