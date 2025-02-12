// Nachrichten Management
function loadMessages() {
    const messagesDiv = document.getElementById('messages');

    db.ref('messages').on('child_added', (snapshot) => {
        const message = snapshot.val();
        const messageElement = createMessage(message);
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Alte Nachrichten aufräumen
function cleanupOldMessages() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    db.ref('messages').orderByChild('timestamp').endAt(oneDayAgo).once('value', (snapshot) => {
        const updates = {};
        snapshot.forEach(child => {
            updates[child.key] = null;
        });
        db.ref('messages').update(updates);
    });
}

// Timer für tägliches Aufräumen
function setupMessageCleanup() {
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0
    );
    const msToMidnight = night.getTime() - now.getTime();

    // Erste Ausführung um Mitternacht
    setTimeout(() => {
        cleanupOldMessages();
        // Dann jeden Tag
        setInterval(cleanupOldMessages, 24 * 60 * 60 * 1000);
    }, msToMidnight);
}

// Starte Cleanup-Timer beim Laden
document.addEventListener('DOMContentLoaded', setupMessageCleanup);
