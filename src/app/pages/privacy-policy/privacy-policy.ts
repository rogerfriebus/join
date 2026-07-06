import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

/**
 * Privacy-Policy-Seite.
 *
 * Die Seite ist öffentlich erreichbar und wird sowohl vor dem Login als auch
 * innerhalb der App über die bestehende Shell angezeigt. Sie enthält zunächst
 * projektbezogene, statische Datenschutz-Hinweise. Eine final geprüfte
 * Rechtstext-Version kann später ohne Änderung der Seitenstruktur ersetzt werden.
 */
@Component({
  selector: 'app-privacy-policy',
  imports: [],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  private readonly location = inject(Location);

  /** Navigiert zurück zur vorherigen Seite. */
  goBack(): void {
    this.location.back();
  }
}
