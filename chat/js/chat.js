// Chat Kernfunktionalität
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message || currentQuote) {
        const prefs = UserPreferences.loadUserPreferences();
        const messageData = {
            username: username,
            type: 'text',
            text: message,
            timestamp: Date.now(),
            color: userColor,
            fontFamily: prefs.fontFamily,
            textColor: prefs.textColor
        };

        if (currentQuote) {
            messageData.quote = currentQuote;
        }

        db.ref('messages').push(messageData);
        messageInput.value = '';

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
        text: message.text,
        imageData: message.type === 'image' ? message.imageData : null
    };

    const messageInput = document.getElementById('messageInput');
    messageInput.focus();
    messageInput.style.borderColor = '#666';
    messageInput.placeholder = `Zitiere ${message.username}...`;
}

// Nachrichten-Element erstellen
function createMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.username === username ? 'own' : 'other'}`;
    messageElement.setAttribute('data-message-id', message.timestamp);

    // Styling nur für eigene Nachrichten
    if (message.username === username) {
        messageElement.style.backgroundColor = message.color || '#f5f5f5';
        messageElement.style.fontFamily = message.fontFamily || 'Arial';
        messageElement.style.color = message.textColor || '#000000';
    } else if (message.username === 'System') {
        messageElement.style.backgroundColor = '#f8f9fa';
        messageElement.style.fontSize = '0.9em';
        messageElement.style.color = '#666';
        messageElement.style.fontStyle = 'italic';
    }

    // Username
    const usernameElement = document.createElement('div');
    usernameElement.className = 'username';
    usernameElement.textContent = message.username;
    messageElement.appendChild(usernameElement);

    // Zitat (falls vorhanden)
    if (message.quote) {
        const quoteElement = document.createElement('div');
        quoteElement.className = 'quoted-message';
        quoteElement.innerHTML = `
            <div class="quoted-username">${message.quote.username}</div>
            <div>${message.quote.text || '<img src="' + message.quote.imageData + '" class="chat-image" style="max-width: 100px; max-height: 100px;">'}</div>
        `;
        messageElement.appendChild(quoteElement);
    }

    // Nachrichteninhalt
    if (message.type === 'image') {
        const img = document.createElement('img');
        img.src = message.imageData;
        img.className = 'chat-image';
        img.onclick = () => showImage(message.imageData);
        messageElement.appendChild(img);
    } else {
        const textElement = document.createElement('div');
        textElement.textContent = message.text;
        messageElement.appendChild(textElement);
    }

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

// Event Listener für Nachrichteneingabe per Enter
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
