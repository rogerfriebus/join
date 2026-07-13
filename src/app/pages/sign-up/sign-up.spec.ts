import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SignUp } from './sign-up';

describe('RegisterNewUser', () => {
  let component: SignUp;
  let fixture: ComponentFixture<SignUp>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SignUp],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SignUp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
