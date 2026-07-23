/**
 * Data model for a contact.
 *
 * Mirrors the planned Supabase table `contacts` (see docs/supabase-setup.md).
 * In the DB the fields are snake_case (created_at / updated_at); in the frontend
 * we use camelCase.
 */
export interface Contact {
  /** UUID, primary key in Supabase. Optional for new, not yet saved contacts. */
  id?: string;
  /** Full name (first and last name). Required field. */
  name: string;
  /** Email address. Required field. */
  email: string;
  /** Phone number (digits only, optional leading +). Required field. */
  phone: string;
  /** Avatar color (hex), for the later contacts UI. Optional, derivable if needed. */
  color?: string;
  /** Initials (e.g. "AS"), for the later contacts UI. Optional, derivable if needed. */
  initials?: string;
  /** Creation timestamp (ISO string), set by Supabase. */
  createdAt?: string;
  /** Last modification timestamp (ISO string), set by Supabase. */
  updatedAt?: string;
}

export interface ContactGroup {
  letter: string;
  contacts: Contact[];
}