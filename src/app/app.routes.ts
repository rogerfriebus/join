import { Routes } from '@angular/router';

/**
 * Routing für Join (SPA).
 *
 * - /login liegt bewusst AUSSERHALB der Shell (kein Header/Navbar/Footer).
 * - Alle App-Seiten laufen als Kind-Routen innerhalb der Shell.
 * - Default-Route leitet auf /login um, Wildcard ebenfalls auf /login.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'summary',
        loadComponent: () =>
          import('./pages/summary/summary').then((m) => m.Summary),
      },
      {
        path: 'board',
        loadComponent: () => import('./pages/board/board').then((m) => m.Board),
      },
      {
        path: 'add-task',
        loadComponent: () =>
          import('./pages/add-task/add-task').then((m) => m.AddTask),
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('./pages/contacts/contacts').then((m) => m.Contacts),
      },
      {
        path: 'legal-notice',
        loadComponent: () =>
          import('./pages/legal-notice/legal-notice').then(
            (m) => m.LegalNotice,
          ),
      },
      {
        path: 'privacy-policy',
        loadComponent: () =>
          import('./pages/privacy-policy/privacy-policy').then(
            (m) => m.PrivacyPolicy,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
