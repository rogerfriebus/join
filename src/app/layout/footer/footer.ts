import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Footer mit rechtlichen Links.
 */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {}
