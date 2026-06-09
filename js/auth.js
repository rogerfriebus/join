// Bereich: auth
// Diese Datei möglichst nur für auth-spezifische Logik verwenden.

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    window.location.href = 'summary.html';
  });
}