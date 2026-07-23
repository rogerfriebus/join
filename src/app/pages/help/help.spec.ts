import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Help } from './help';

describe('Help', () => {
  let component: Help;
  let fixture: ComponentFixture<Help>;
  let backSpy: ReturnType<typeof vi.fn>;

  function textContent(): string {
    return fixture.nativeElement.textContent;
  }

  beforeEach(async () => {
    backSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Help],
      providers: [{ provide: Location, useValue: { back: backSpy } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Help);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays the Help heading and the Figma content', () => {
    const text = textContent();

    expect(text).toContain('Help');
    expect(text).toContain('What is Join?');
    expect(text).toContain('How to use it');
    expect(text).toContain('Welcome to the help page for Join');
    expect(text).toContain('Here is a step-by-step guide on how to use Join');
    expect(text).toContain('Enjoy using Join!');
    expect(text).toContain('project team information in the Legal Notice');
    expect(text).not.toContain('[Your Contact Email]');
  });

  it('displays all five usage steps', () => {
    const text = textContent();

    expect(text).toContain('Exploring the Board');
    expect(text).toContain('Creating Contacts');
    expect(text).toContain('Adding Cards');
    expect(text).toContain('Moving Cards');
    expect(text).toContain('Deleting Cards');
  });

  it('navigates back via the back button', () => {
    fixture.nativeElement.querySelector('.help__back').click();

    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});
