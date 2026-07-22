import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Main application navigation for authenticated and public areas.
 *
 * Links to protected pages (Summary, Add Task, Board, Contacts) are shown only
 * to authenticated users. Logged-out users see the login entry and, on mobile,
 * the public Help, Privacy Policy, and Legal Notice links. The authGuard remains
 * the final protection layer. The brand logo intentionally links guests to /login.
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private authService = inject(AuthService);

  /** Indicates whether a user, including a guest, is authenticated. */
  readonly isAuthenticated = this.authService.isAuthenticated;
}
