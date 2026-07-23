import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNotice } from './legal-notice';

describe('LegalNotice', () => {
  let component: LegalNotice;
  let fixture: ComponentFixture<LegalNotice>;
  let backSpy: ReturnType<typeof vi.fn>;

  function textContent(): string {
    return fixture.nativeElement.textContent;
  }

  beforeEach(async () => {
    backSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [LegalNotice],
      providers: [{ provide: Location, useValue: { back: backSpy } }],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalNotice);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays the Legal Notice heading and the Figma content', () => {
    const text = textContent();

    expect(text).toContain('Legal Notice');
    expect(text).toContain('Imprint');
    expect(text).toContain('Acceptance of terms');
    expect(text).toContain('Scope and ownership of the product');
    expect(text).toContain('Roger');
    expect(text).toContain('Kevin');
    expect(text).toContain('Marco');
    expect(text).not.toContain('July 26, 2023');
  });

  it('displays all legal content sections', () => {
    const sections = fixture.nativeElement.querySelectorAll(
      '.legal-notice__imprint, .legal-notice__block',
    );

    expect(sections.length).toBe(7);
  });

  it('navigates back via the back button', () => {
    fixture.nativeElement.querySelector('.legal-notice__back').click();

    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});
