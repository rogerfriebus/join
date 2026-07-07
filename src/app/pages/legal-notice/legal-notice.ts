import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

/**
 * Legal-Notice-Seite.
 *
 * Die Seite ist öffentlich erreichbar und wird sowohl vor dem Login als auch
 * innerhalb der App über die bestehende Shell angezeigt. Die Navigation für
 * ausgeloggte Nutzer wird global über die Navbar gesteuert und zeigt dort nur
 * den Login-Einstieg.
 */
@Component({
  selector: 'app-legal-notice',
  imports: [],
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNotice {
  private readonly location = inject(Location);

  /** Navigiert zurück zur vorherigen Seite. */
  goBack(): void {
    this.location.back();
  }
}
