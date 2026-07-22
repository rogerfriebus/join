import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

/**
 * Public Legal Notice page.
 *
 * The page is available before login and within the application shell. Navigation
 * for logged-out users is controlled globally by the navbar and exposes only the
 * permitted public entries.
 */
@Component({
  selector: 'app-legal-notice',
  imports: [],
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNotice {
  private readonly location = inject(Location);

  /** Navigates back to the previous page. */
  goBack(): void {
    this.location.back();
  }
}
