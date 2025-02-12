// Settings Management
const settingsModal = document.getElementById('settingsModal');
const settingsButton = document.getElementById('settingsButton');
const settingsUsername = document.getElementById('settingsUsername');
const fontSelect = document.getElementById('fontSelect');
const previewBox = document.getElementById('previewBox');
const previewText = document.getElementById('previewText');
let lastUsername = ''; // Speichert den letzten Benutzernamen

// Font-Einstellungen
const availableFonts = [
    { name: 'Arial', displayName: 'Arial' },
    { name: 'Times New Roman', displayName: 'Times New Roman' },
    { name: 'Comic Sans MS', displayName: 'Comic Sans' },
    { name: 'Courier New', displayName: 'Courier' },
    { name: 'Georgia', displayName: 'Georgia' },
    { name: 'Verdana', displayName: 'Verdana' },
    { name: 'Trebuchet MS', displayName: 'Trebuchet' },
    { name: 'Impact', displayName: 'Impact' }
];

// Schriftgrößen
const fontSizes = [
    { value: '12px', label: 'Klein' },
    { value: '14px', label: 'Normal' },
    { value: '16px', label: 'Mittel' },
    { value: '18px', label: 'Groß' },
    { value: '20px', label: 'Sehr Groß' }
];

// Farben für Hintergrund und Text
const bgColors = ['#e3f2fd', '#ffcdd2', '#c8e6c9', '#fff9c4', '#d1c4e9', '#ffccbc', '#f5f5f5'];
const textColors = ['#000000', '#1565C0', '#2E7D32', '#C62828', '#4527A0', '#E65100', '#37474F'];

// Settings initialisieren
function initializeSettings() {
    // Lade gespeicherte Einstellungen
    const prefs = UserPreferences.loadUserPreferences();
    lastUsername = prefs.username;

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

    // UI-Elemente initialisieren
    initializeFontSelect();
    initializeFontSizeSelect();
    initializeStyleButtons();
    initializeColorPickers();

    // Event Listener für Live-Vorschau
    addPreviewListeners();

    // Gespeicherte Einstellungen anwenden
    applySettings(prefs);
}

function initializeFontSelect() {
    fontSelect.innerHTML = availableFonts
        .map(font => `<option value="${font.name}">${font.displayName}</option>`)
        .join('');
}

function initializeFontSizeSelect() {
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    fontSizeSelect.innerHTML = fontSizes
        .map(size => `<option value="${size.value}">${size.label}</option>`)
        .join('');
}

function initializeStyleButtons() {
    const boldButton = document.getElementById('boldButton');
    const italicButton = document.getElementById('italicButton');

    boldButton.onclick = () => {
        boldButton.classList.toggle('active');
        updatePreview();
    };

    italicButton.onclick = () => {
        italicButton.classList.toggle('active');
        updatePreview();
    };
}

function initializeColorPickers() {
    // Hintergrundfarben
    initializeColorPicker('settingsColorPicker', bgColors);

    // Textfarben
    initializeColorPicker('textColorPicker', textColors);
}

function initializeColorPicker(containerId, colors) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = colors.map(color => `
        <div class="color-option"
             data-color="${color}"
             style="background-color: ${color}">
        </div>
    `).join('');

    // Event Listener für Farbauswahl
    container.querySelectorAll('.color-option').forEach(option => {
        option.onclick = () => {
            container.querySelectorAll('.color-option')
                .forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            updatePreview();
        };
    });
}

function addPreviewListeners() {
    // Input/Change Events für alle Einstellungen
    settingsUsername.addEventListener('input', updatePreview);
    fontSelect.addEventListener('change', updatePreview);
    document.getElementById('fontSizeSelect').addEventListener('change', updatePreview);
}

function updatePreview() {
    if (!previewBox || !previewText) return;

    const selectedBgColor = document.querySelector('#settingsColorPicker .color-option.selected');
    const selectedTextColor = document.querySelector('#textColorPicker .color-option.selected');
    const fontSize = document.getElementById('fontSizeSelect').value;
    const isBold = document.getElementById('boldButton').classList.contains('active');
    const isItalic = document.getElementById('italicButton').classList.contains('active');

    // Update Preview Box
    previewBox.style.backgroundColor = selectedBgColor ? selectedBgColor.dataset.color : window.userColor;
    previewText.style.color = selectedTextColor ? selectedTextColor.dataset.color : window.userTextColor;
    previewText.style.fontFamily = fontSelect.value;
    previewText.style.fontSize = fontSize;
    previewText.style.fontWeight = isBold ? 'bold' : 'normal';
    previewText.style.fontStyle = isItalic ? 'italic' : 'normal';
}

function openSettingsModal() {
    const prefs = UserPreferences.loadUserPreferences();

    // Formularfelder mit aktuellen Werten füllen
    settingsUsername.value = window.username || prefs.username || lastUsername;
    fontSelect.value = prefs.fontFamily;
    document.getElementById('fontSizeSelect').value = prefs.fontSize;

    // Schriftstil-Buttons aktualisieren
    document.getElementById('boldButton').classList.toggle('active', prefs.fontWeight === 'bold');
    document.getElementById('italicButton').classList.toggle('active', prefs.fontStyle === 'italic');

    // Farben markieren
    markSelectedColor('settingsColorPicker', prefs.userColor);
    markSelectedColor('textColorPicker', prefs.textColor);

    // Vorschau aktualisieren
    updatePreview();

    settingsModal.style.display = 'block';
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

function saveSettings() {
    const selectedBgColor = document.querySelector('#settingsColorPicker .color-option.selected');
    const selectedTextColor = document.querySelector('#textColorPicker .color-option.selected');
    const fontSize = document.getElementById('fontSizeSelect').value;
    const isBold = document.getElementById('boldButton').classList.contains('active');
    const isItalic = document.getElementById('italicButton').classList.contains('active');

    if (!selectedBgColor || !selectedTextColor) {
        alert('Bitte wählen Sie sowohl eine Hintergrund- als auch eine Textfarbe aus');
        return;
    }

    const newPrefs = {
        username: settingsUsername.value.trim() || lastUsername,
        userColor: selectedBgColor.dataset.color,
        textColor: selectedTextColor.dataset.color,
        fontFamily: fontSelect.value,
        fontSize: fontSize,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: isItalic ? 'italic' : 'normal'
    };

    if (!newPrefs.username) {
        alert('Bitte geben Sie einen Benutzernamen ein');
        return;
    }

    // Speichere neue Einstellungen
    UserPreferences.saveUserPreferences(newPrefs);
    lastUsername = newPrefs.username;

    // Prüfe auf Namensänderung
    const oldUsername = window.username;
    if (oldUsername !== newPrefs.username) {
        db.ref('messages').push({
            username: 'System',
            type: 'text',
            text: `${oldUsername} hat seinen Namen zu ${newPrefs.username} geändert`,
            timestamp: Date.now()
        });
    }

    // Wende neue Einstellungen an
    applySettings(newPrefs);

    // Schließe Modal
    closeSettingsModal();
}

function applySettings(prefs) {
    // Globale Variablen aktualisieren
    window.username = prefs.username;
    window.userColor = prefs.userColor;
    window.userTextColor = prefs.textColor;
    window.userFontFamily = prefs.fontFamily;
    window.userFontSize = prefs.fontSize;
    window.userFontWeight = prefs.fontWeight;
    window.userFontStyle = prefs.fontStyle;

    // CSS Variablen aktualisieren
    document.documentElement.style.setProperty('--user-color', prefs.userColor);
    document.documentElement.style.setProperty('--user-text-color', prefs.textColor);
    document.documentElement.style.setProperty('--user-font-family', prefs.fontFamily);
    document.documentElement.style.setProperty('--user-font-size', prefs.fontSize);
    document.documentElement.style.setProperty('--user-font-weight', prefs.fontWeight);
    document.documentElement.style.setProperty('--user-font-style', prefs.fontStyle);

    // Bestehende Nachrichten aktualisieren
    updateExistingMessages(prefs);
}

function updateExistingMessages(prefs) {
    const messages = document.querySelectorAll('.message.own .message-content');
    messages.forEach(message => {
        message.style.fontFamily = prefs.fontFamily;
        message.style.fontSize = prefs.fontSize;
        message.style.fontWeight = prefs.fontWeight;
        message.style.fontStyle = prefs.fontStyle;
        message.style.color = prefs.textColor;
    });
}

function markSelectedColor(pickerId, color) {
    const colorOptions = document.querySelectorAll(`#${pickerId} .color-option`);
    colorOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === color) {
            option.classList.add('selected');
        }
    });
}

// Initialisiere Einstellungen beim Laden
document.addEventListener('DOMContentLoaded', initializeSettings);
