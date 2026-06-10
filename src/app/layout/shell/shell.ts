import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

/**
 * Layout-Shell: rahmt die eingeloggten App-Seiten mit Header, Navbar und Footer.
 * Der <router-outlet /> rendert die jeweils aktive Kind-Route.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Header, Navbar, Footer],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {}
