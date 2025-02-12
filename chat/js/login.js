// Login Management
document.addEventListener('DOMContentLoaded', () => {
    initializeColorPicker();

    // Prüfe gespeicherte Benutzerdaten
    const prefs = UserPreferences.loadUserPreferences();
    if (prefs.username) {
        document.getElementById('username').value = prefs.username;
        document.querySelector(`[data-color="${prefs.userColor}"]`)?.classList.add('selected');
    }
});

function initializeColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    const colors = ['#e3f2fd', '#ffcdd2', '#c8e6c9', '#fff9c4', '#d1c4e9'];

    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;
        colorOption.onclick = () => {
            document.querySelectorAll('#colorPicker .color-option')
                .forEach(opt => opt.classList.remove('selected'));
            colorOption.classList.add('selected');
        };
        colorPicker.appendChild(colorOption);
    });
}

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
        fontFamily: UserPreferences.getPreference('fontFamily') || 'Arial',
        textColor: UserPreferences.getPreference('textColor') || '#000000'
    };
    UserPreferences.saveUserPreferences(prefs);

    // Setze globale Variablen
    window.username = enteredUsername;
    window.userColor = color;
    window.userFontFamily = prefs.fontFamily;
    window.userTextColor = prefs.textColor;

    // UI aktualisieren
    document.getElementById('login').style.display = 'none';
    document.getElementById('chat').style.display = 'flex';

    // Lade Chat-Nachrichten
    loadMessages();

    // Sende Beitritts-Nachricht
    db.ref('messages').push({
        username: 'System',
        type: 'text',
        text: `${enteredUsername} ist dem Chat beigetreten`,
        timestamp: Date.now(),
        color: '#f5f5f5'
    });

    // Fokus auf Nachrichteneingabe
    document.getElementById('messageInput').focus();
}

// Event Listener für Login per Enter
document.getElementById('username')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        login();
    }
});
