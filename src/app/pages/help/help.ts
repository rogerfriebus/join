import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

/**
 * Help-Seite mit statischer Einführung in Join.
 *
 * Die Seite erklärt kurz den Zweck der App und die wichtigsten Schritte im
 * Board-Workflow. Navigation und Auth-Logik bleiben außerhalb dieser Seite.
 */
@Component({
  selector: 'app-help',
  imports: [],
  templateUrl: './help.html',
  styleUrl: './help.scss',
})
export class Help {
  private readonly location = inject(Location);

  /** Navigiert zurück zur vorherigen App-Seite. */
  goBack(): void {
    this.location.back();
  }
}
