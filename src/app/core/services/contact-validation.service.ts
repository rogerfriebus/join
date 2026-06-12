import { Injectable } from '@angular/core';

/**
 * Validierungsfehler je Contact-Feld.
 *
 * Ein Feld ist nur dann gesetzt, wenn für dieses Feld ein Fehler vorliegt.
 * Ein leeres Objekt bedeutet: Eingaben sind gültig.
 */
export interface ContactValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
}

/** Roh-Eingabe eines Contact-Formulars (vor dem Speichern). */
export interface ContactInput {
  name: string;
  email: string;
  phone: string;
}

/**
 * Zentrale Validierungslogik für Contact-Formulare (Add/Edit).
 *
 * Liefert pro Feld entweder `null` (gültig) oder eine verständliche
 * Fehlermeldung als String. Die UI bindet diese Meldungen später unter
 * dem jeweiligen Input ein (keine HTML5-Standardvalidation als Hauptlösung).
 *
 * Bewusst KEINE CRUD-/Supabase-Logik – nur reine Validierung.
 */
@Injectable({ providedIn: 'root' })
export class ContactValidationService {
  /**
   * Name: Pflichtfeld, Vor- und Nachname (mind. zwei Wörter), keine Zahlen.
   * Erlaubt sind Buchstaben, Leerzeichen, Bindestrich und Apostroph.
   */
  validateName(name: string): string | null {
    const value = (name ?? '').trim();
    if (!value) {
      return 'Bitte einen Namen eingeben.';
    }
    if (/\d/.test(value)) {
      return 'Der Name darf keine Zahlen enthalten.';
    }
    if (/[^\p{L}\s'-]/u.test(value)) {
      return 'Der Name enthält ungültige Zeichen.';
    }
    const parts = value.split(/\s+/).filter((part) => part.length > 0);
    if (parts.length < 2) {
      return 'Bitte Vor- und Nachname eingeben.';
    }
    return null;
  }

  /**
   * E-Mail: Pflichtfeld, einfache Regex-Prüfung auf übliches Format
   * (local@domain.tld).
   */
  validateEmail(email: string): string | null {
    const value = (email ?? '').trim();
    if (!value) {
      return 'Bitte eine E-Mail-Adresse eingeben.';
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return 'Bitte eine gültige E-Mail-Adresse eingeben.';
    }
    return null;
  }

  /**
   * Phone: Pflichtfeld, nur Ziffern mit optional führendem `+` und
   * Leerzeichen zur Lesbarkeit. Mindestens 6 Ziffern.
   */
  validatePhone(phone: string): string | null {
    const value = (phone ?? '').trim();
    if (!value) {
      return 'Bitte eine Telefonnummer eingeben.';
    }
    // Erlaubt: ein optionales führendes '+', danach Ziffern und Leerzeichen.
    if (!/^\+?[\d\s]+$/.test(value)) {
      return 'Bitte eine gültige Telefonnummer eingeben.';
    }
    const digits = value.replace(/\s/g, '').replace(/^\+/, '');
    if (digits.length < 6) {
      return 'Bitte eine gültige Telefonnummer eingeben.';
    }
    return null;
  }

  /**
   * Validiert eine komplette Formular-Eingabe und liefert die Fehler je Feld.
   * Ein leeres Objekt bedeutet: alle Felder sind gültig.
   */
  validateContactInput(input: ContactInput): ContactValidationErrors {
    const errors: ContactValidationErrors = {};
    const nameError = this.validateName(input.name);
    if (nameError) {
      errors.name = nameError;
    }
    const emailError = this.validateEmail(input.email);
    if (emailError) {
      errors.email = emailError;
    }
    const phoneError = this.validatePhone(input.phone);
    if (phoneError) {
      errors.phone = phoneError;
    }
    return errors;
  }
}
