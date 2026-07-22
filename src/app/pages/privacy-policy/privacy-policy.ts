import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

/**
 * Public Privacy Policy page.
 *
 * The page is available before login and within the application shell. It contains
 * project-specific static privacy information that can later be replaced by a
 * legally reviewed version without changing the page structure.
 */
@Component({
  selector: 'app-privacy-policy',
  imports: [],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  private readonly location = inject(Location);

  /** Navigates back to the previous page. */
  goBack(): void {
    this.location.back();
  }
}
