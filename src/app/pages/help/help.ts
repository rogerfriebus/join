import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

/**
 * Help page with a static introduction to Join.
 *
 * Briefly explains the purpose of the application and the main board workflow.
 * Navigation and authentication logic remain outside this component.
 */
@Component({
  selector: 'app-help',
  imports: [],
  templateUrl: './help.html',
  styleUrl: './help.scss',
})
export class Help {
  private readonly location = inject(Location);

  /** Navigates back to the previous application page. */
  goBack(): void {
    this.location.back();
  }
}
