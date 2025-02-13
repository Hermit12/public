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

// Dateiauswahl über Button
function handleFileSelect() {
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

// Clipboard Handling für Bilder
async function handlePasteImage() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        let imageFound = false;
        
        for (const clipboardItem of clipboardItems) {
            // Prüfe verfügbare Bildformate
            const imageTypes = clipboardItem.types.filter(type => 
                type.startsWith('image/') || type === 'text/plain'
            );
            
            if (imageTypes.length > 0) {
                let blob;
                
                // Versuche zuerst, das Bild direkt zu bekommen
                for (const type of imageTypes) {
                    if (type.startsWith('image/')) {
                        blob = await clipboardItem.getType(type);
                        imageFound = true;
                        break;
                    }
                }
                
                // Wenn kein direktes Bild gefunden wurde, prüfe auf SVG-Text
                if (!blob && imageTypes.includes('text/plain')) {
                    const textBlob = await clipboardItem.getType('text/plain');
                    const text = await textBlob.text();
                    
                    if (text.trim().toLowerCase().startsWith('<svg') && 
                        text.trim().toLowerCase().endsWith('</svg>')) {
                        const base64String = 'data:image/svg+xml;base64,' + 
                            btoa(unescape(encodeURIComponent(text)));
                        
                        const messageData = {
                            username: window.username,
                            type: 'image',
                            imageData: base64String,
                            timestamp: Date.now(),
                            color: window.userColor
                        };
                        
                        await db.ref('messages').push(messageData);
                        imageFound = true;
                        return;
                    }
                }
                
                if (blob) {
                    await uploadAndSendImage(blob);
                    return;
                }
            }
        }
        
        if (!imageFound) {
            alert('Kein Bild in der Zwischenablage gefunden');
        }
        
    } catch (error) {
        console.error('Fehler beim Bildereinfügen:', error);
        alert('Fehler beim Einfügen des Bildes aus der Zwischenablage.');
    }
}

// Event Listener für Paste-Events (Strg+V)
document.addEventListener('paste', async (e) => {
    if (document.getElementById('chat').style.display === 'none') return;

    const clipboardData = e.clipboardData || window.clipboardData;
    
    // Prüfe auf Bilder in der Zwischenablage
    if (clipboardData.items) {
        const items = Array.from(clipboardData.items);
        
        for (const item of items) {
            // Liste der unterstützten MIME-Types
            if (item.type.match(/^image\/(png|jpeg|jpg|gif|bmp|webp|svg\+xml)$/)) {
                e.preventDefault();
                try {
                    const file = item.getAsFile();
                    if (file) {
                        await uploadAndSendImage(file);
                    }
                } catch (error) {
                    console.error('Fehler beim Verarbeiten des Bildes:', error);
                    alert('Das Bild konnte nicht verarbeitet werden.');
                }
                return;
            }
        }
        
        // Prüfe auf SVG als Text
        const pastedText = clipboardData.getData('text');
        if (pastedText.trim().toLowerCase().startsWith('<svg') && 
            pastedText.trim().toLowerCase().endsWith('</svg>')) {
            e.preventDefault();
            try {
                const base64String = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(pastedText)));
                const messageData = {
                    username: window.username,
                    type: 'image',
                    imageData: base64String,
                    timestamp: Date.now(),
                    color: window.userColor
                };
                await db.ref('messages').push(messageData);
            } catch (error) {
                console.error('Fehler beim SVG-Einfügen:', error);
                alert('Das SVG konnte nicht eingefügt werden.');
            }
            return;
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
            const ctx = canvas.getContext('2d');
            
            // Maximale Dimensionen
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            const MAX_SIZE_MB = 1;
            
            let { width, height } = img;
            
            // Skaliere das Bild wenn es zu groß ist
            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Bild zeichnen
            ctx.drawImage(img, 0, 0, width, height);
            
            // Qualität anpassen basierend auf Bildgröße
            let quality = 0.7;
            canvas.toBlob((initialBlob) => {
                if (initialBlob.size > MAX_SIZE_MB * 1024 * 1024) {
                    quality = Math.min(quality, (MAX_SIZE_MB * 1024 * 1024) / initialBlob.size);
                }
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            }, 'image/jpeg', 1);
            
            URL.revokeObjectURL(img.src);
        };
        
        img.onerror = () => {
            // Bei Fehler original Blob zurückgeben
            resolve(blob);
            URL.revokeObjectURL(img.src);
        };
    });
}