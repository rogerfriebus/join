import { Injectable } from '@angular/core';

/**
 * Validation errors per contact field.
 *
 * A field is only set when there is an error for that field.
 * An empty object means: the inputs are valid.
 */
export interface ContactValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
}

/** Raw input of a contact form (before saving). */
export interface ContactInput {
  name: string;
  email: string;
  phone: string;
}

/**
 * Central validation logic for contact forms (Add/Edit).
 *
 * Returns per field either `null` (valid) or an understandable error message as
 * a string. The UI later binds these messages below the respective input (no
 * HTML5 standard validation as the primary solution).
 *
 * Deliberately NO CRUD/Supabase logic – pure validation only.
 */
@Injectable({ providedIn: 'root' })
export class ContactValidationService {
  /**
   * Name: required field, first and last name (at least two words), no numbers.
   * Allowed are letters, spaces, hyphen and apostrophe.
   */
  validateName(name: string): string | null {
    const value = (name ?? '').trim();
    if (!value) {
      return 'Please enter a name.';
    }
    if (/\d/.test(value)) {
      return 'The name must not contain any numbers.';
    }
    if (/[^\p{L}\s'-]/u.test(value)) {
      return 'The name contains invalid characters.';
    }
    const parts = value.split(/\s+/).filter((part) => part.length > 0);
    if (parts.length < 2) {
      return 'Please enter first and last name.';
    }
    return null;
  }

  /**
   * Email: required field, simple regex check for the usual format
   * (local@domain.tld).
   */
  validateEmail(email: string): string | null {
    const value = (email ?? '').trim();
    if (!value) {
      return 'Please enter an email address.';
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return 'Please enter a valid email address.';
    }
    return null;
  }

  /**
   * Phone: required field, digits only with an optional leading `+` and spaces
   * for readability. At least 6 digits.
   */
  validatePhone(phone: string): string | null {
    const value = (phone ?? '').trim();
    if (!value) {
      return 'Please enter a phone number.';
    }
    // Allowed: an optional leading '+', then digits and spaces.
    if (!/^\+?[\d\s]+$/.test(value)) {
      return 'Please enter a valid phone number.';
    }
    const digits = value.replace(/\s/g, '').replace(/^\+/, '');
    if (digits.length < 6) {
      return 'Please enter a valid phone number.';
    }
    return null;
  }

  /**
   * Validates a complete form input and returns the errors per field.
   * An empty object means: all fields are valid.
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
