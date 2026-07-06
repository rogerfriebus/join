import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyPolicy } from './privacy-policy';

describe('PrivacyPolicy', () => {
  let component: PrivacyPolicy;
  let fixture: ComponentFixture<PrivacyPolicy>;
  let backSpy: ReturnType<typeof vi.fn>;

  function textContent(): string {
    return fixture.nativeElement.textContent;
  }

  beforeEach(async () => {
    backSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [PrivacyPolicy],
      providers: [{ provide: Location, useValue: { back: backSpy } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicy);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('zeigt die Privacy-Policy-Überschrift und den Figma-Content', () => {
    const text = textContent();

    expect(text).toContain('Privacy Policy');
    expect(text).toContain('Data processing in Join');
    expect(text).toContain('before signing up or logging in');
    expect(text).toContain('Your data and rights');
  });

  it('zeigt zwei Content-Abschnitte', () => {
    const sections = fixture.nativeElement.querySelectorAll('.privacy-policy__section');

    expect(sections.length).toBe(2);
  });

  it('navigiert über den Back-Button zurück', () => {
    fixture.nativeElement.querySelector('.privacy-policy__back').click();

    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});
