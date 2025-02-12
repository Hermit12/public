// Login Management
document.addEventListener('DOMContentLoaded', () => {
    // Prüfe gespeicherte Benutzerdaten
    const prefs = UserPreferences.loadUserPreferences();
    if (prefs.username) {
        document.getElementById('username').value = prefs.username;
        document.querySelector(`[data-color="${prefs.userColor}"]`)?.classList.add('selected');
    }
});

function login() {
    const usernameInput = document.getElementById('username');
    const enteredUsername = usernameInput.value.trim();

    if (!enteredUsername) {
        usernameInput.style.borderColor = 'red';
        return;
    }

    // Hole ausgewählte Farbe oder Standardfarbe
    const selectedColor = document.querySelector('#colorPicker .color-option.selected');
    const color = selectedColor ? selectedColor.dataset.color : '#e3f2fd';

    // Speichere Benutzerdaten
    const prefs = {
        username: enteredUsername,
        userColor: color,
        fontFamily: UserPreferences.getPreference('fontFamily') || 'Arial'
    };
    UserPreferences.saveUserPreferences(prefs);

    // Setze globale Variablen
    username = enteredUsername;
    userColor = color;

    // UI aktualisieren
    document.getElementById('login').style.display = 'none';
    document.getElementById('chat').style.display = 'block';

    // Lade Chat-Nachrichten
    loadMessages();

    // Sende Beitritts-Nachricht
    db.ref('messages').push({
        username: 'System',
        type: 'text',
        text: `${username} ist dem Chat beigetreten`,
        timestamp: Date.now(),
        color: '#f5f5f5'
    });
}

// Event Listener für Login per Enter
document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        login();
    }
});
