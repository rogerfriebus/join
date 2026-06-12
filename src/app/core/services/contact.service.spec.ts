import { ContactService } from './contact.service';
import { Contact } from '../models/contact.model';

describe('ContactService', () => {
  let service: ContactService;

  // Frische Instanz pro Test: der Mock-Bestand ist mutable, daher dürfen
  // sich die Tests nicht über gemeinsamen State beeinflussen.
  beforeEach(() => {
    service = new ContactService();
  });

  describe('getContacts', () => {
    it('liefert eine Liste', () => {
      expect(Array.isArray(service.getContacts())).toBe(true);
    });

    it('enthält mindestens 10 Kontakte', () => {
      expect(service.getContacts().length).toBeGreaterThanOrEqual(10);
    });

    it('hat eindeutige IDs', () => {
      const ids = service.getContacts().map((contact) => contact.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getContactById', () => {
    it('findet einen bestehenden Kontakt', () => {
      const first = service.getContacts()[0];
      expect(service.getContactById(first.id as string)).toEqual(first);
    });

    it('gibt undefined bei unbekannter ID zurück', () => {
      expect(service.getContactById('does-not-exist')).toBeUndefined();
    });
  });

  describe('addContact', () => {
    const draft: Contact = {
      name: 'Maximilian Vogel',
      email: 'maximilian.vogel@example.com',
      phone: '+49 155 9876543',
    };

    it('fügt einen Kontakt hinzu', () => {
      const before = service.getContacts().length;
      service.addContact(draft);
      expect(service.getContacts().length).toBe(before + 1);
    });

    it('erzeugt eine ID, wenn keine ID vorhanden ist', () => {
      const added = service.addContact(draft);
      expect(added.id).toBeTruthy();
    });

    it('erzeugt keine doppelte ID', () => {
      const added = service.addContact(draft);
      const ids = service.getContacts().map((contact) => contact.id);
      expect(ids.filter((id) => id === added.id).length).toBe(1);
    });

    it('macht den neuen Kontakt per getContactById auffindbar', () => {
      const added = service.addContact(draft);
      expect(service.getContactById(added.id as string)).toEqual(added);
    });
  });

  describe('updateContact', () => {
    it('aktualisiert einen bestehenden Kontakt', () => {
      const first = service.getContacts()[0];
      const updated = service.updateContact({ ...first, name: 'Geänderter Name' });
      expect(updated?.name).toBe('Geänderter Name');
      expect(service.getContactById(first.id as string)?.name).toBe('Geänderter Name');
    });

    it('gibt undefined bei unbekannter ID zurück', () => {
      const result = service.updateContact({
        id: 'does-not-exist',
        name: 'Niemand Nirgends',
        email: 'niemand@example.com',
        phone: '+49 100 0000000',
      });
      expect(result).toBeUndefined();
    });

    it('gibt undefined zurück, wenn keine ID gesetzt ist', () => {
      const result = service.updateContact({
        name: 'Ohne Id',
        email: 'ohne.id@example.com',
        phone: '+49 100 1111111',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('deleteContact', () => {
    it('löscht einen bestehenden Kontakt und gibt true zurück', () => {
      const first = service.getContacts()[0];
      const before = service.getContacts().length;
      expect(service.deleteContact(first.id as string)).toBe(true);
      expect(service.getContacts().length).toBe(before - 1);
    });

    it('macht den Kontakt danach nicht mehr auffindbar', () => {
      const first = service.getContacts()[0];
      service.deleteContact(first.id as string);
      expect(service.getContactById(first.id as string)).toBeUndefined();
    });

    it('gibt false bei unbekannter ID zurück', () => {
      const before = service.getContacts().length;
      expect(service.deleteContact('does-not-exist')).toBe(false);
      expect(service.getContacts().length).toBe(before);
    });
  });
});
