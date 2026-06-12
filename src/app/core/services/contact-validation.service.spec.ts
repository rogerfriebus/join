import { ContactValidationService } from './contact-validation.service';

describe('ContactValidationService', () => {
  let service: ContactValidationService;

  beforeEach(() => {
    service = new ContactValidationService();
  });

  describe('validateName', () => {
    it('lehnt einen leeren Namen ab', () => {
      expect(service.validateName('')).toBe('Bitte einen Namen eingeben.');
    });

    it('lehnt einen reinen Vornamen ab', () => {
      expect(service.validateName('Anna')).toBe('Bitte Vor- und Nachname eingeben.');
    });

    it('akzeptiert Vor- und Nachname', () => {
      expect(service.validateName('Anna Schulz')).toBeNull();
    });

    it('lehnt einen Namen mit Zahl ab', () => {
      expect(service.validateName('Anna 123')).toBe('Der Name darf keine Zahlen enthalten.');
    });

    it('akzeptiert einen Namen mit Bindestrich', () => {
      expect(service.validateName('Anna-Lena Schulz')).toBeNull();
    });
  });

  describe('validateEmail', () => {
    it('lehnt eine leere E-Mail ab', () => {
      expect(service.validateEmail('')).toBe('Bitte eine E-Mail-Adresse eingeben.');
    });

    it('akzeptiert eine einfache gültige E-Mail', () => {
      expect(service.validateEmail('anna.schulz@example.com')).toBeNull();
    });

    it('lehnt eine E-Mail ohne @ ab', () => {
      expect(service.validateEmail('anna.schulz')).toBe('Bitte eine gültige E-Mail-Adresse eingeben.');
    });

    it('lehnt eine E-Mail ohne Domain ab', () => {
      expect(service.validateEmail('anna@')).toBe('Bitte eine gültige E-Mail-Adresse eingeben.');
    });
  });

  describe('validatePhone', () => {
    it('lehnt eine leere Telefonnummer ab', () => {
      expect(service.validatePhone('')).toBe('Bitte eine Telefonnummer eingeben.');
    });

    it('akzeptiert eine Telefonnummer mit Ziffern', () => {
      expect(service.validatePhone('030123456')).toBeNull();
    });

    it('akzeptiert eine Telefonnummer mit führendem + und Leerzeichen', () => {
      expect(service.validatePhone('+49 151 1234567')).toBeNull();
    });

    it('lehnt eine Telefonnummer mit Buchstaben ab', () => {
      expect(service.validatePhone('abc')).toBe('Bitte eine gültige Telefonnummer eingeben.');
    });

    it('lehnt eine zu kurze Telefonnummer ab', () => {
      expect(service.validatePhone('+49 12')).toBe('Bitte eine gültige Telefonnummer eingeben.');
    });
  });

  describe('validateContactInput', () => {
    it('liefert ein leeres Fehlerobjekt für gültige Eingaben', () => {
      const errors = service.validateContactInput({
        name: 'Anna Schulz',
        email: 'anna.schulz@example.com',
        phone: '+49 151 1234567',
      });
      expect(errors).toEqual({});
    });

    it('liefert Fehler je ungültigem Feld', () => {
      const errors = service.validateContactInput({
        name: 'Anna',
        email: 'anna@',
        phone: 'abc',
      });
      expect(errors.name).toBe('Bitte Vor- und Nachname eingeben.');
      expect(errors.email).toBe('Bitte eine gültige E-Mail-Adresse eingeben.');
      expect(errors.phone).toBe('Bitte eine gültige Telefonnummer eingeben.');
    });
  });
});
