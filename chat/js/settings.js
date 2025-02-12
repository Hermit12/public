// Settings Management
const settingsModal = document.getElementById('settingsModal');
const settingsButton = document.getElementById('settingsButton');
const settingsUsername = document.getElementById('settingsUsername');
const fontSelect = document.getElementById('fontSelect');

// Einstellungen initialisieren
function initializeSettings() {
    const prefs = UserPreferences.loadUserPreferences();

    // Einstellungen-Button Event Listener
    settingsButton.addEventListener('click', openSettingsModal);

    // Schließen-Button Event Listener
    document.querySelector('#settingsModal .close')?.addEventListener('click', closeSettingsModal);

    // Modal außerhalb klicken zum Schließen
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });

    // Farbwähler im Einstellungsmenü initialisieren
    initializeSettingsColorPicker();

    // Font-Familie anwenden
    document.body.style.fontFamily = prefs.fontFamily;
    fontSelect.value = prefs.fontFamily;
}

function openSettingsModal() {
    const prefs = UserPreferences.loadUserPreferences();
    settingsUsername.value = prefs.username;
    fontSelect.value = prefs.fontFamily;

    // Aktuelle Farbe im ColorPicker markieren
    const colorOptions = document.querySelectorAll('#settingsColorPicker .color-option');
    colorOptions.forEach(option => {
        option.classList.toggle('selected', option.dataset.color === prefs.userColor);
    });

    settingsModal.style.display = 'block';
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

function saveSettings() {
    const newPrefs = {
        username: settingsUsername.value.trim(),
        userColor: document.querySelector('#settingsColorPicker .color-option.selected').dataset.color,
        fontFamily: fontSelect.value,
        textColor: document.querySelector('#textColorPicker .color-option.selected').dataset.color || '#000000'
    };

    // Speichere neue Einstellungen
    UserPreferences.saveUserPreferences(newPrefs);

    // Wende neue Einstellungen an
    username = newPrefs.username;
    userColor = newPrefs.userColor;
    document.body.style.fontFamily = newPrefs.fontFamily;

    // Schließe Modal
    closeSettingsModal();
}

function initializeColorPickers() {
    // Hintergrundfarben
    const bgColors = ['#e3f2fd', '#ffcdd2', '#c8e6c9', '#fff9c4', '#d1c4e9'];
    initializeColorPicker('settingsColorPicker', bgColors);

    // Textfarben
    const textColors = ['#000000', '#1565C0', '#2E7D32', '#C62828', '#4527A0', '#E65100'];
    initializeColorPicker('textColorPicker', textColors);
}

function initializeColorPicker(containerId, colors) {
    const container = document.getElementById(containerId);

    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;
        colorOption.onclick = () => {
            document.querySelectorAll(`#${containerId} .color-option`)
                .forEach(opt => opt.classList.remove('selected'));
            colorOption.classList.add('selected');
        };
        container.appendChild(colorOption);
    });
}

// Initialisiere Einstellungen beim Laden
document.addEventListener('DOMContentLoaded', initializeSettings);
