// Zentrale Speicherfunktionen.
// Später kann diese Datei von Local Storage auf Firebase / Remote Storage umgestellt werden.

function saveToLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key, fallbackValue = null) {
  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.error(`Could not parse local storage value for key: ${key}`, error);
    return fallbackValue;
  }
}
