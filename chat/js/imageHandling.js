// Bild-Handling
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeButton = document.getElementsByClassName('close')[0];

// Bild Modal anzeigen
function showImage(src) {
    modal.style.display = 'block';
    modalImg.src = src;
}

// Modal schließen
function closeImageModal() {
    modal.style.display = 'none';
}

// Event Listener für Modal
closeButton.onclick = closeImageModal;
modal.onclick = (event) => {
    if (event.target === modal) {
        closeImageModal();
    }
};

// ESC Taste zum Schließen
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'block') {
        closeImageModal();
    }
});

// Bild aus Zwischenablage verarbeiten
async function handlePasteImage() {
    try {
        const clipboard = await navigator.clipboard.read();
        for (const item of clipboard) {
            if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                const blob = await item.getType(item.types[0]);
                await uploadAndSendImage(blob);
            }
        }
    } catch (err) {
        alert('Bitte kopiere zuerst ein Bild in die Zwischenablage');
        console.error('Fehler beim Bildupload:', err);
    }
}

// Bild hochladen und senden
async function uploadAndSendImage(blob) {
    try {
        const compressedBlob = await compressImage(blob);
        const base64String = await blobToBase64(compressedBlob);

        const messageData = {
            username: username,
            type: 'image',
            imageData: base64String,
            timestamp: Date.now(),
            color: userColor
        };

        if (currentQuote) {
            messageData.quote = currentQuote;
            clearQuote();
        }

        db.ref('messages').push(messageData);
    } catch (error) {
        console.error('Fehler beim Bildupload:', error);
        alert('Fehler beim Hochladen des Bildes');
    }
}

// Blob zu Base64 konvertieren
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Bild komprimieren
async function compressImage(blob) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(resolve, 'image/jpeg', 0.7);
        };
    });
}

// Event Listener für Bild einfügen
document.addEventListener('paste', async (e) => {
    if (document.getElementById('chat').style.display === 'block') {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                const blob = item.getAsFile();
                await uploadAndSendImage(blob);
                break;
            }
        }
    }
});
