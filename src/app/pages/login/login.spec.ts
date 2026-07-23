import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Login } from './login';
import { AuthService } from '../../core/services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let router: Router;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows an error message and does not navigate on a wrong password', async () => {
    await auth.signUp('Anna Schulz', 'anna@example.com', 'secret');
    auth.logout();
    const nav = vi.spyOn(router, 'navigateByUrl');

    component.form = { email: 'anna@example.com', password: 'wrong' };
    await component.login();

    expect(component.loginError).toBe('Email or password is incorrect.');
    expect(nav).not.toHaveBeenCalled();
  });

  it('navigates on a successful login via the AuthRedirectService', async () => {
    await auth.signUp('Anna Schulz', 'anna@example.com', 'secret');
    auth.logout();
    const nav = vi.spyOn(router, 'navigateByUrl');

    component.form = { email: 'anna@example.com', password: 'secret' };
    await component.login();

    expect(component.loginError).toBe('');
    expect(nav).toHaveBeenCalledWith('/summary');
  });

  it('navigates on guest login via the AuthRedirectService', async () => {
    const nav = vi.spyOn(router, 'navigateByUrl');

    await component.guestLogin();

    expect(nav).toHaveBeenCalledWith('/summary');
    expect(auth.isGuest()).toBe(true);
  });
});
