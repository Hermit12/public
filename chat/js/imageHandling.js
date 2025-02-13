// Bild-Handling
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeButton = document.getElementsByClassName('close')[0];

let gifWorker = null;

function initGifWorker() {
    if (!gifWorker) {
        gifWorker = new Worker('js/gif-worker.js');

        gifWorker.onerror = function(error) {
            console.error('GIF Worker Fehler:', error);
            showCompressProgress('Fehler bei der GIF-Verarbeitung', true);
        };
    }
}

function showCompressProgress(progress, isError = false) {
    let progressElement = document.getElementById('gifProgress');
    if (!progressElement) {
        progressElement = document.createElement('div');
        progressElement.id = 'gifProgress';
        progressElement.style.position = 'fixed';
        progressElement.style.bottom = '20px';
        progressElement.style.left = '50%';
        progressElement.style.transform = 'translateX(-50%)';
        progressElement.style.padding = '10px 20px';
        progressElement.style.borderRadius = '5px';
        progressElement.style.backgroundColor = isError ? '#ff4444' : '#2196F3';
        progressElement.style.color = 'white';
        progressElement.style.zIndex = '1000';
        document.body.appendChild(progressElement);
    }

    progressElement.textContent = progress;
    progressElement.style.backgroundColor = isError ? '#ff4444' : '#2196F3';

    if (progress === 'Fertig!' || isError) {
        setTimeout(() => {
            if (progressElement.parentNode) {
                progressElement.parentNode.removeChild(progressElement);
            }
        }, 2000);
    }
}

async function compressGif(blob) {
    const MAX_GIF_SIZE = 1 * 1024 * 1024; // 1MB

    // Wenn das GIF bereits klein genug ist, zurückgeben
    if (blob.size <= MAX_GIF_SIZE) {
        return blob;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const blobUrl = URL.createObjectURL(blob);

        img.onload = () => {
            try {
                let { width, height } = img;

                // Berechne Skalierung basierend auf der Größe
                let scale = Math.sqrt(MAX_GIF_SIZE / blob.size);

                // Begrenze die Skalierung
                width = Math.max(Math.floor(width * scale), 100);
                height = Math.max(Math.floor(height * scale), 100);

                // Erstelle ein GIF-Objekt
                const gif = new GIF({
                    workers: 2,
                    quality: 10,
                    width: width,
                    height: height
                });

                // Canvas für die Skalierung
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Bild auf Canvas zeichnen
                ctx.drawImage(img, 0, 0, width, height);

                // Frame zum GIF hinzufügen
                gif.addFrame(canvas, {
                    copy: true,
                    delay: 100
                });

                // Fortschritts-Handler
                gif.on('progress', progress => {
                    const percent = Math.round(progress * 100);
                    console.log(`Komprimierung: ${percent}%`);
                });

                // Fertigstellungs-Handler
                gif.on('finished', blob => {
                    URL.revokeObjectURL(blobUrl);
                    resolve(blob);
                });

                // GIF rendern
                gif.render();

            } catch (error) {
                URL.revokeObjectURL(blobUrl);
                console.error('GIF-Komprimierungsfehler:', error);
                reject(error);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error('Fehler beim Laden des GIFs'));
        };

        img.src = blobUrl;
    });
}

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

// Schließen bei Klick außerhalb des Bildes
modal.addEventListener('click', (event) => {
    // Schließe nur, wenn direkt auf das Modal geklickt wurde
    if (event.target === modal) {
        closeImageModal();
    }
});

// Verhindere, dass Klicks auf dem Bild das Modal schließen
modalImg.addEventListener('click', (event) => {
    event.stopPropagation();
});

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



// Blob zu Base64 konvertieren
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


async function compressImage(blob) {
    if (blob.type === 'image/gif') {
        try {
            return await compressGif(blob);
        } catch (error) {
            console.error('Fehler bei GIF-Komprimierung:', error);
            throw new Error('GIF konnte nicht komprimiert werden.');
        }
    }

    // Für andere Bildtypen
    const LIMITS = {
        image: {
            maxSize: 1 * 1024 * 1024,
            maxWidth: 1200,
            maxHeight: 1200,
            defaultQuality: 0.8
        }
    };

    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let { width, height } = img;

            if (width > LIMITS.image.maxWidth || height > LIMITS.image.maxHeight) {
                const ratio = Math.min(
                    LIMITS.image.maxWidth / width,
                    LIMITS.image.maxHeight / height
                );
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            let quality = LIMITS.image.defaultQuality;
            canvas.toBlob((initialBlob) => {
                if (initialBlob.size > LIMITS.image.maxSize) {
                    quality = Math.min(
                        quality,
                        (LIMITS.image.maxSize / initialBlob.size) * quality
                    );
                }

                const outputType = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';
                canvas.toBlob(resolve, outputType, quality);
            }, blob.type === 'image/png' ? 'image/png' : 'image/jpeg', 1);

            URL.revokeObjectURL(img.src);
        };

        img.onerror = () => {
            resolve(blob);
            URL.revokeObjectURL(img.src);
        };
    });
}

async function uploadAndSendImage(blob) {
    try {
        let compressedBlob;

        if (blob.type === 'image/gif') {
            try {
                compressedBlob = await compressGif(blob);
            } catch (error) {
                console.error('GIF-Komprimierung fehlgeschlagen, verwende Original:', error);
                compressedBlob = blob;
            }
        } else {
            compressedBlob = await compressImage(blob);
        }

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
        alert('Das Bild konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
    }
}



// Funktion zum Prüfen der Bildgröße
function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Fehler beim Laden des Bildes'));
        };
    });
}
