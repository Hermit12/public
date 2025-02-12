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

async function handlePasteImage() {
    // Öffne einen File-Dialog wenn der Button geklickt wird
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await uploadAndSendImage(file);
        }
        document.body.removeChild(input);
    };

    input.click();
}

// Event Listener für Paste-Events (für Copy & Paste)
document.addEventListener('paste', async (e) => {
    if (document.getElementById('chat').style.display === 'none') return;

    // Behandle Bilder aus der Zwischenablage
    if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    await uploadAndSendImage(file);
                    break;
                }
            }
        }
    }
});

// Drag & Drop Support
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', async (e) => {
    e.preventDefault();

    if (document.getElementById('chat').style.display === 'none') return;

    if (e.dataTransfer.items) {
        for (const item of e.dataTransfer.items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    await uploadAndSendImage(file);
                    break;
                }
            }
        }
    } else if (e.dataTransfer.files) {
        for (const file of e.dataTransfer.files) {
            if (file.type.indexOf('image') !== -1) {
                await uploadAndSendImage(file);
                break;
            }
        }
    }
});

// Bild hochladen und senden
async function uploadAndSendImage(blob) {
    try {
        const compressedBlob = await compressImage(blob);
        const base64String = await blobToBase64(compressedBlob);

        const messageData = {
            username: window.username,
            type: 'image',
            imageData: base64String,
            timestamp: Date.now(),
            color: window.userColor
        };

        if (currentQuote) {
            messageData.quote = currentQuote;
            clearQuote();
        }

        await db.ref('messages').push(messageData);
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
