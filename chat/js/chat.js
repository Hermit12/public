// Chat Kernfunktionalität
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message || currentQuote) {
        // Hole alle aktuellen Formatierungseinstellungen
        const messageData = {
            username: window.username,
            type: 'text',
            text: message,
            timestamp: Date.now(),
            // Speichere alle Formatierungseinstellungen
            color: window.userColor,
            fontFamily: window.userFontFamily,
            fontSize: window.userFontSize,
            fontWeight: window.userFontWeight,
            fontStyle: window.userFontStyle,
            textColor: window.userTextColor
        };

        if (currentQuote) {
            // Prüfe, ob es ein zitiertes GIF/Bild ist
            if (currentQuote.imageData) {
                messageData.quote = {
                    username: currentQuote.username,
                    text: '', // Leerer Text für Bilder/GIFs
                    imageData: currentQuote.imageData,
                    type: 'image'
                };
            } else {
                messageData.quote = currentQuote;
            }
        }

        db.ref('messages').push(messageData);
        messageInput.value = '';
        messageInput.style.height = 'auto';

        clearQuote();
    }
}

function clearQuote() {
    currentQuote = null;
    const messageInput = document.getElementById('messageInput');
    messageInput.style.borderColor = '';
    messageInput.placeholder = 'Deine Nachricht...';
}

function quoteMessage(message) {
    currentQuote = {
        username: message.username,
        text: message.text || '',
        imageData: message.type === 'image' ? message.imageData : null,
        type: message.type
    };

    const messageInput = document.getElementById('messageInput');
    messageInput.focus();
    messageInput.style.borderColor = '#666';
    messageInput.placeholder = `Zitiere ${message.username}...`;
}

// Nachrichten-Element erstellen
function createMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.username === window.username ? 'own' : message.username === 'System' ? 'system' : 'other'}`;
    messageElement.setAttribute('data-message-id', message.timestamp);

    // Header mit Username
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const usernameElement = document.createElement('div');
    usernameElement.className = 'username';
    usernameElement.textContent = message.username;
    messageHeader.appendChild(usernameElement);

    messageElement.appendChild(messageHeader);

    // Nachrichteninhalt Container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content';

    // Formatierung anwenden, unabhängig ob eigene oder fremde Nachricht
    if (message.username !== 'System') {
        contentContainer.style.backgroundColor = message.color || '#f5f5f5';
        contentContainer.style.fontFamily = message.fontFamily || 'Arial';
        contentContainer.style.fontSize = message.fontSize || '14px';
        contentContainer.style.fontWeight = message.fontWeight || 'normal';
        contentContainer.style.fontStyle = message.fontStyle || 'normal';
        contentContainer.style.color = message.textColor || '#000000';
    }

    // Zitat (falls vorhanden)
    if (message.quote) {
        const quoteElement = document.createElement('div');
        quoteElement.className = 'quoted-message';
        quoteElement.innerHTML = `
            <div class="quoted-username">${message.quote.username}</div>
            <div>${message.quote.text || '<img src="' + message.quote.imageData + '" class="chat-image" style="max-width: 100px; max-height: 100px;">'}</div>
        `;
        contentContainer.appendChild(quoteElement);
    }

    // Nachrichteninhalt
    if (message.type === 'image') {
        const img = document.createElement('img');
        img.src = message.imageData;
        img.className = 'chat-image';
        img.onclick = () => showImage(message.imageData);
        contentContainer.appendChild(img);
    } else {
        const textElement = document.createElement('div');
        textElement.className = 'message-text';
        textElement.textContent = message.text;
        contentContainer.appendChild(textElement);
    }

    messageElement.appendChild(contentContainer);

    // Zeitstempel und Zitieren-Button
    const timestampElement = document.createElement('div');
    timestampElement.className = 'timestamp';
    timestampElement.textContent = new Date(message.timestamp).toLocaleString();

    if (message.username !== 'System') {
        const quoteButton = document.createElement('span');
        quoteButton.className = 'quote-button';
        quoteButton.textContent = '↩ Zitieren';
        quoteButton.onclick = () => quoteMessage(message);
        timestampElement.appendChild(quoteButton);
    }

    messageElement.appendChild(timestampElement);
    return messageElement;
}

// Nachrichten laden
function loadMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    // Stelle sicher, dass der Chat-Container sichtbar ist
    const chatContainer = document.getElementById('chat');
    chatContainer.style.display = 'flex';

    // Hole alle Nachrichten auf einmal
    db.ref('messages').once('value', (snapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
            messages.push(childSnapshot.val());
        });

        // Sortiere Nachrichten nach Zeitstempel
        messages.sort((a, b) => a.timestamp - b.timestamp);

        // Füge alle Nachrichten hinzu
        messages.forEach(message => {
            const messageElement = createMessage(message);
            messagesDiv.appendChild(messageElement);
        });

        // Scrolle zum Ende nach dem Laden aller Nachrichten
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    // Listener für neue Nachrichten
    db.ref('messages').on('child_added', (snapshot) => {
        const message = snapshot.val();
        // Prüfe ob die Nachricht bereits angezeigt wird
        const existingMessage = document.querySelector(`[data-message-id="${message.timestamp}"]`);
        
        if (!existingMessage) {
            const messageElement = createMessage(message);
            messagesDiv.appendChild(messageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            // Wenn es eine neue Nachricht von jemand anderem ist
            if (message.username !== window.username) {
                // Prüfe ob wir in Electron sind
                if (window.require) {
                    const { ipcRenderer } = window.require('electron');
                    ipcRenderer.send('new-message', {
                        username: message.username,
                        message: message.type === 'text' ? message.text : '[Bild/GIF]'
                    });
                }
            }
        }
    });
}

// Chat Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat');
    const loginContainer = document.getElementById('login');
    const messageInput = document.getElementById('messageInput');

    // Korrekte Anzeige der Container
    if (UserPreferences.getPreference('username')) {
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
        loadMessages();
    } else {
        loginContainer.style.display = 'block';
        chatContainer.style.display = 'none';
    }

    // Event Listener für Nachrichteneingabe
    if (messageInput) {
        // Enter zum Senden (ohne Shift)
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Textarea Auto-resize
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // Chat Container auf display: none setzen wenn nicht eingeloggt
    if (!UserPreferences.getPreference('username')) {
        chatContainer.style.display = 'none';
    }
});
