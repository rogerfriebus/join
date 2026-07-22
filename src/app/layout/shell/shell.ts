import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

/**
 * Application shell that wraps authenticated pages with the header, navbar, and footer.
 * The <router-outlet /> renders the currently active child route.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Header, Navbar, Footer],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {}
