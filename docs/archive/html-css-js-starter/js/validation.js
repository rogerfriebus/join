// Gemeinsame Formularvalidierung.
// Nur Funktionen einbauen, die mehrere Bereiche wirklich gemeinsam nutzen.

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
