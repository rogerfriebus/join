import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Login-Seite (Einstieg der SPA).
 *
 * TODO (Sprint 1+): Login-Formular, Gast-Login, Registrierung, Validierung.
 * Gast-Login und eingeloggte User nutzen laut Kursvorgabe denselben Datenbestand.
 */
@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {}
