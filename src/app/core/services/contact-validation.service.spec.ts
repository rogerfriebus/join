import { ContactValidationService } from './contact-validation.service';

describe('ContactValidationService', () => {
  let service: ContactValidationService;

  beforeEach(() => {
    service = new ContactValidationService();
  });

  describe('validateName', () => {
    it('rejects an empty name', () => {
      expect(service.validateName('')).toBe('Please enter a name.');
    });

    it('rejects a first name only', () => {
      expect(service.validateName('Anna')).toBe('Please enter first and last name.');
    });

    it('accepts a first and last name', () => {
      expect(service.validateName('Anna Schulz')).toBeNull();
    });

    it('rejects a name containing a number', () => {
      expect(service.validateName('Anna 123')).toBe('The name must not contain any numbers.');
    });

    it('accepts a name with a hyphen', () => {
      expect(service.validateName('Anna-Lena Schulz')).toBeNull();
    });
  });

  describe('validateEmail', () => {
    it('rejects an empty email', () => {
      expect(service.validateEmail('')).toBe('Please enter an email address.');
    });

    it('accepts a simple valid email', () => {
      expect(service.validateEmail('anna.schulz@example.com')).toBeNull();
    });

    it('rejects an email without @', () => {
      expect(service.validateEmail('anna.schulz')).toBe('Please enter a valid email address.');
    });

    it('rejects an email without a domain', () => {
      expect(service.validateEmail('anna@')).toBe('Please enter a valid email address.');
    });
  });

  describe('validatePhone', () => {
    it('rejects an empty phone number', () => {
      expect(service.validatePhone('')).toBe('Please enter a phone number.');
    });

    it('accepts a phone number with digits', () => {
      expect(service.validatePhone('030123456')).toBeNull();
    });

    it('accepts a phone number with a leading + and spaces', () => {
      expect(service.validatePhone('+49 151 1234567')).toBeNull();
    });

    it('rejects a phone number containing letters', () => {
      expect(service.validatePhone('abc')).toBe('Please enter a valid phone number.');
    });

    it('rejects a phone number that is too short', () => {
      expect(service.validatePhone('+49 12')).toBe('Please enter a valid phone number.');
    });
  });

  describe('validateContactInput', () => {
    it('returns an empty error object for valid input', () => {
      const errors = service.validateContactInput({
        name: 'Anna Schulz',
        email: 'anna.schulz@example.com',
        phone: '+49 151 1234567',
      });
      expect(errors).toEqual({});
    });

    it('returns an error for each invalid field', () => {
      const errors = service.validateContactInput({
        name: 'Anna',
        email: 'anna@',
        phone: 'abc',
      });
      expect(errors.name).toBe('Please enter first and last name.');
      expect(errors.email).toBe('Please enter a valid email address.');
      expect(errors.phone).toBe('Please enter a valid phone number.');
    });
  });
});
