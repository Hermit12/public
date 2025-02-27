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

// UI-Hilfsfunktionen für Fortschritt
function showProgressUI(message, isError = false) {
    let progressElement = document.getElementById('progressUI');
    
    if (!progressElement) {
        progressElement = document.createElement('div');
        progressElement.id = 'progressUI';
        progressElement.style.position = 'fixed';
        progressElement.style.bottom = '20px';
        progressElement.style.left = '50%';
        progressElement.style.transform = 'translateX(-50%)';
        progressElement.style.padding = '10px 20px';
        progressElement.style.borderRadius = '5px';
        progressElement.style.color = 'white';
        progressElement.style.zIndex = '1000';
        progressElement.style.fontWeight = 'bold';
        progressElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        document.body.appendChild(progressElement);
    }
    
    progressElement.textContent = message;
    progressElement.style.backgroundColor = isError ? '#ff4444' : '#2196F3';
    
    return progressElement;
}

function hideProgressUI(delay = 2000) {
    const progressElement = document.getElementById('progressUI');
    if (progressElement) {
        setTimeout(() => {
            if (progressElement.parentNode) {
                progressElement.parentNode.removeChild(progressElement);
            }
        }, delay);
    }
}

// Funktion zum Dekodieren eines GIFs mit libgif-js
function decodeGif(gifUrl) {
    return new Promise((resolve, reject) => {
        // SuperGif-Objekt erstellen (libgif-js)
        const tempImg = document.createElement('img');
        tempImg.src = gifUrl;
        tempImg.style.position = 'absolute';
        tempImg.style.opacity = '0';
        tempImg.style.pointerEvents = 'none';
        document.body.appendChild(tempImg);
        
        try {
            const gif = new SuperGif({ 
                gif: tempImg,
                auto_play: false 
            });
            
            gif.load(() => {
                try {
                    const frames = [];
                    const frameCount = gif.get_length();
                    
                    // Alle Frames extrahieren
                    for (let i = 0; i < frameCount; i++) {
                        gif.move_to(i);
                        const canvas = gif.get_canvas();
                        const frameData = canvas.toDataURL('image/png');
                        frames.push({
                            data: frameData,
                            delay: gif.get_frames()[i].delay * 10 // Konvertiere zu Millisekunden
                        });
                    }
                    
                    document.body.removeChild(tempImg);
                    resolve({
                        frames: frames,
                        width: gif.get_canvas().width,
                        height: gif.get_canvas().height
                    });
                } catch (error) {
                    document.body.removeChild(tempImg);
                    reject(error);
                }
            });
        } catch (error) {
            document.body.removeChild(tempImg);
            reject(error);
        }
    });
}

// Animated GIF mit GIF.js komprimieren
async function compressAnimatedGif(blob) {
    try {
        const MAX_GIF_SIZE = 1.5 * 1024 * 1024; // 1.5MB
        
        // Wenn das GIF bereits klein genug ist, zurückgeben
        if (blob.size <= MAX_GIF_SIZE) {
            return blob;
        }
        
        showProgressUI("Animiertes GIF wird komprimiert...");
        
        // Blob zu URL konvertieren
        const blobUrl = URL.createObjectURL(blob);
        
        return new Promise(async (resolve, reject) => {
            try {
                // Temporäres Bild zum Erfassen der Dimensionen
                const img = new Image();
                img.onload = async function() {
                    const originalWidth = img.width;
                    const originalHeight = img.height;
                    
                    // Komprimierungsfaktoren berechnen basierend auf der Größe
                    const sizeRatio = blob.size / MAX_GIF_SIZE;
                    let quality = 10;
                    let scaleDown = 1;
                    let frameSkip = 0;
                    
                    // Anpassungen basierend auf der GIF-Größe
                    if (sizeRatio > 5) {
                        // Für sehr große GIFs
                        quality = 5;
                        scaleDown = 0.5;
                        frameSkip = 2; // Jeden dritten Frame nehmen
                    } else if (sizeRatio > 3) {
                        // Für große GIFs
                        quality = 7;
                        scaleDown = 0.6;
                        frameSkip = 1; // Jeden zweiten Frame nehmen
                    } else if (sizeRatio > 2) {
                        // Für mittelgroße GIFs
                        quality = 10;
                        scaleDown = 0.7;
                        frameSkip = 0; // Alle Frames behalten
                    } else {
                        // Für kleinere GIFs
                        quality = 10;
                        scaleDown = 0.8;
                        frameSkip = 0; // Alle Frames behalten
                    }
                    
                    // Neue Dimensionen berechnen
                    const newWidth = Math.round(originalWidth * scaleDown);
                    const newHeight = Math.round(originalHeight * scaleDown);
                    
                    // GIF.js initialisieren
                    const gif = new GIF({
                        workers: 2,
                        quality: quality,
                        width: newWidth,
                        height: newHeight,
                        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
                    });
                    
                    // GIF-Frames mit FileReader laden
                    try {
                        // Alle Frames des animierten GIFs extrahieren
                        const gifReader = new FileReader();
                        gifReader.onload = async function() {
                            try {
                                const gifLib = document.createElement('script');
                                gifLib.src = 'https://cdnjs.cloudflare.com/ajax/libs/libgif-js/3.0.3/libgif.js';
                                document.head.appendChild(gifLib);
                                
                                gifLib.onload = async function() {
                                    try {
                                        // GIF dekodieren
                                        const gifData = await decodeGif(blobUrl);
                                        showProgressUI("GIF-Frames werden verarbeitet...");
                                        
                                        // Canvas für die Skalierung
                                        const canvas = document.createElement('canvas');
                                        canvas.width = newWidth;
                                        canvas.height = newHeight;
                                        const ctx = canvas.getContext('2d');
                                        
                                        // Fortschritts-Handler
                                        gif.on('progress', progress => {
                                            showProgressUI(`GIF wird generiert: ${Math.round(progress * 100)}%`);
                                        });
                                        
                                        // Frames hinzufügen (mit Überspringen bestimmter Frames)
                                        for (let i = 0; i < gifData.frames.length; i += frameSkip + 1) {
                                            const frame = gifData.frames[i];
                                            const frameImg = new Image();
                                            
                                            // Promise für das Laden des Frame-Bildes
                                            await new Promise(resolveFrame => {
                                                frameImg.onload = () => {
                                                    // Frame auf Canvas zeichnen und skalieren
                                                    ctx.clearRect(0, 0, newWidth, newHeight);
                                                    ctx.drawImage(frameImg, 0, 0, newWidth, newHeight);
                                                    
                                                    // Frame zum GIF hinzufügen
                                                    gif.addFrame(canvas, {
                                                        copy: true,
                                                        delay: frame.delay,
                                                        disposal: 2 // Standardwert für Animationen
                                                    });
                                                    
                                                    resolveFrame();
                                                };
                                                frameImg.src = frame.data;
                                            });
                                        }
                                        
                                        showProgressUI("GIF wird zusammengesetzt...");
                                        
                                        // Fertigstellungs-Handler
                                        gif.on('finished', blob => {
                                            showProgressUI(`GIF komprimiert: ${Math.round(blob.size / 1024)} KB`);
                                            console.log(`GIF komprimiert: ${Math.round(blob.size / 1024)} KB`);
                                            URL.revokeObjectURL(blobUrl);
                                            document.head.removeChild(gifLib);
                                            resolve(blob);
                                        });
                                        
                                        // GIF rendern
                                        gif.render();
                                        
                                    } catch (error) {
                                        console.error('Fehler beim GIF-Dekodieren:', error);
                                        URL.revokeObjectURL(blobUrl);
                                        document.head.removeChild(gifLib);
                                        reject(error);
                                    }
                                };
                                
                                // Fehlerbehandlung für Bibliothek
                                gifLib.onerror = function(error) {
                                    console.error('Fehler beim Laden der libgif-js Bibliothek:', error);
                                    URL.revokeObjectURL(blobUrl);
                                    reject(new Error('Fehler beim Laden der GIF-Bibliothek'));
                                };
                                
                            } catch (error) {
                                console.error('Fehler beim GIF-Extrahieren:', error);
                                URL.revokeObjectURL(blobUrl);
                                reject(error);
                            }
                        };
                        
                        gifReader.onerror = function() {
                            URL.revokeObjectURL(blobUrl);
                            reject(new Error('Fehler beim Lesen des GIFs'));
                        };
                        
                        gifReader.readAsDataURL(blob);
                        
                    } catch (error) {
                        console.error('Fehler bei der GIF-Verarbeitung:', error);
                        URL.revokeObjectURL(blobUrl);
                        reject(error);
                    }
                };
                
                img.onerror = function() {
                    URL.revokeObjectURL(blobUrl);
                    reject(new Error('Fehler beim Laden des GIF-Bildes'));
                };
                
                img.src = blobUrl;
                
            } catch (error) {
                console.error('Fehler bei der GIF-Komprimierung:', error);
                URL.revokeObjectURL(blobUrl);
                reject(error);
            }
        });
    } catch (error) {
        console.error('Fehler bei der GIF-Komprimierung:', error);
        showProgressUI('Fehler bei der GIF-Komprimierung', true);
        throw error;
    }
}

// Alternativer Ansatz: GIF mit dem GifEncoder komprimieren
async function compressGifWithEncoder(blob) {
    try {
        const MAX_GIF_SIZE = 1.5 * 1024 * 1024; // 1.5MB
        
        // Wenn das GIF bereits klein genug ist, zurückgeben
        if (blob.size <= MAX_GIF_SIZE) {
            return blob;
        }
        
        showProgressUI("GIF wird komprimiert...");
        
        // GIF.js direkt verwenden
        return new Promise((resolve, reject) => {
            // GIF in ein Image-Element laden
            const blobUrl = URL.createObjectURL(blob);
            const img = new Image();
            
            img.onload = function() {
                try {
                    // Komprimierungsfaktoren basierend auf Größe
                    const sizeRatio = blob.size / MAX_GIF_SIZE;
                    let scale = 1;
                    let quality = 10;
                    
                    if (sizeRatio > 5) {
                        scale = 0.5;
                        quality = 5;
                    } else if (sizeRatio > 3) {
                        scale = 0.7;
                        quality = 7; 
                    } else {
                        scale = 0.8;
                        quality = 10;
                    }
                    
                    // Neue Dimensionen
                    const width = Math.round(img.width * scale);
                    const height = Math.round(img.height * scale);
                    
                    // GIF.js verwenden
                    const gif = new GIF({
                        workers: 2,
                        quality: quality,
                        width: width,
                        height: height,
                        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
                    });
                    
                    // Canvas für die Skalierung
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    
                    // Bild auf Canvas zeichnen
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Fortschritts-Handler
                    gif.on('progress', progress => {
                        showProgressUI(`GIF wird erstellt: ${Math.round(progress * 100)}%`);
                    });
                    
                    // Fertigstellungs-Handler
                    gif.on('finished', compressedBlob => {
                        showProgressUI(`GIF komprimiert: ${Math.round(compressedBlob.size / 1024)} KB`);
                        URL.revokeObjectURL(blobUrl);
                        resolve(compressedBlob);
                    });
                    
                    // Frame hinzufügen
                    gif.addFrame(canvas, {copy: true});
                    
                    // GIF rendern
                    gif.render();
                    
                } catch (error) {
                    URL.revokeObjectURL(blobUrl);
                    reject(error);
                }
            };
            
            img.onerror = function() {
                URL.revokeObjectURL(blobUrl);
                reject(new Error('Fehler beim Laden des GIFs'));
            };
            
            img.src = blobUrl;
        });
    } catch (error) {
        console.error('GIF Encoder Fehler:', error);
        throw error;
    }
}

// Direkter Ansatz über GIF.js Worker
async function compressGifWithWorker(blob) {
    try {
        const MAX_GIF_SIZE = 1.5 * 1024 * 1024; // 1.5MB
        
        // Wenn das GIF bereits klein genug ist, zurückgeben
        if (blob.size <= MAX_GIF_SIZE) {
            return blob;
        }
        
        showProgressUI("GIF wird durch Worker verarbeitet...");
        
        return new Promise((resolve, reject) => {
            const blobUrl = URL.createObjectURL(blob);
            const img = new Image();
            
            img.onload = function() {
                // Neue Dimensionen basierend auf der Größe berechnen
                const sizeRatio = blob.size / MAX_GIF_SIZE;
                let scale = 0.8;
                
                if (sizeRatio > 5) {
                    scale = 0.4;
                } else if (sizeRatio > 3) {
                    scale = 0.5;
                } else if (sizeRatio > 2) {
                    scale = 0.6;
                }
                
                const width = Math.max(Math.floor(img.width * scale), 200);
                const height = Math.max(Math.floor(img.height * scale), 200);
                
                // File zu ArrayBuffer konvertieren für den Worker
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        // GIF Worker erstellen
                        const worker = new Worker('js/gif-worker.js');
                        
                        // Fortschritts-Handler
                        worker.onmessage = function(e) {
                            const { type, progress, result, error } = e.data;
                            
                            if (type === 'progress') {
                                showProgressUI(`GIF wird komprimiert: ${Math.round(progress * 100)}%`);
                            } else if (type === 'finished') {
                                showProgressUI(`GIF komprimiert: ${Math.round(result.size / 1024)} KB`);
                                URL.revokeObjectURL(blobUrl);
                                resolve(result);
                                worker.terminate();
                            } else if (type === 'error') {
                                showProgressUI('Fehler bei der GIF-Komprimierung', true);
                                URL.revokeObjectURL(blobUrl);
                                reject(new Error(error));
                                worker.terminate();
                            }
                        };
                        
                        // Fehler-Handler
                        worker.onerror = function(error) {
                            showProgressUI('Worker-Fehler bei der GIF-Komprimierung', true);
                            URL.revokeObjectURL(blobUrl);
                            reject(error);
                            worker.terminate();
                        };
                        
                        // Daten an Worker senden
                        worker.postMessage({
                            arrayBuffer: e.target.result,
                            width: width,
                            height: height,
                            fpsReduction: sizeRatio > 3 ? 1 : 0 // Jeden zweiten Frame überspringen bei sehr großen GIFs
                        });
                        
                    } catch (error) {
                        URL.revokeObjectURL(blobUrl);
                        reject(error);
                    }
                };
                
                reader.onerror = function() {
                    URL.revokeObjectURL(blobUrl);
                    reject(new Error('Fehler beim Lesen des GIFs'));
                };
                
                reader.readAsArrayBuffer(blob);
            };
            
            img.onerror = function() {
                URL.revokeObjectURL(blobUrl);
                reject(new Error('Fehler beim Laden des GIFs'));
            };
            
            img.src = blobUrl;
        });
    } catch (error) {
        console.error('Worker-Fehler:', error);
        showProgressUI('Fehler bei der GIF-Komprimierung', true);
        throw error;
    }
}

// Komprimiert normale Bilder
async function compressImage(blob) {
    // Überspringe SVGs
    if (blob.type === 'image/svg+xml') {
        return blob;
    }

    const LIMITS = {
        maxSize: 1024 * 1024, // 1MB
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8
    };

    try {
        return new Promise((resolve, reject) => {
            const blobUrl = URL.createObjectURL(blob);
            const img = new Image();
            
            img.onload = function() {
                let { width, height } = img;
                
                // Skalierung, wenn zu groß
                if (width > LIMITS.maxWidth || height > LIMITS.maxHeight) {
                    const ratio = Math.min(
                        LIMITS.maxWidth / width,
                        LIMITS.maxHeight / height
                    );
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // Bild auf Canvas zeichnen
                ctx.drawImage(img, 0, 0, width, height);
                
                // Als Bild speichern mit Qualitätskompression
                const outputType = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const quality = blob.type === 'image/png' ? 0.9 : 0.8;
                
                canvas.toBlob(function(compressedBlob) {
                    URL.revokeObjectURL(blobUrl);
                    
                    if (!compressedBlob) {
                        reject(new Error("Bildkomprimierung fehlgeschlagen"));
                        return;
                    }
                    
                    // Wenn das Bild immer noch zu groß ist, nochmals komprimieren
                    if (compressedBlob.size > LIMITS.maxSize) {
                        const newQuality = Math.min(quality * (LIMITS.maxSize / compressedBlob.size), 0.7);
                        canvas.toBlob(function(finalBlob) {
                            if (!finalBlob) {
                                reject(new Error("Finale Bildkomprimierung fehlgeschlagen"));
                                return;
                            }
                            resolve(finalBlob);
                        }, outputType, newQuality);
                    } else {
                        resolve(compressedBlob);
                    }
                }, outputType, quality);
            };
            
            img.onerror = function() {
                URL.revokeObjectURL(blobUrl);
                reject(new Error('Fehler beim Laden des Bildes'));
            };
            
            img.src = blobUrl;
        });
    } catch (error) {
        console.error('Bildkomprimierungsfehler:', error);
        throw error;
    }
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

// Blob zu Base64 konvertieren
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Hauptfunktion zum Hochladen und Senden eines Bildes
async function uploadAndSendImage(blob) {
    try {
        showProgressUI('Bild wird vorbereitet...');
        
        let compressedBlob;
        
        if (blob.type === 'image/gif') {
            try {
                showProgressUI('GIF wird für Chat optimiert...');
                
                // Versuche zuerst die Worker-Methode
                compressedBlob = await compressGifWithWorker(blob);
                
                // Falls die Worker-Methode fehlschlägt, versuche die direkte Methode
                if (!compressedBlob || compressedBlob.size > 1.5 * 1024 * 1024) {
                    showProgressUI('Alternative GIF-Komprimierung wird verwendet...');
                    compressedBlob = await compressAnimatedGif(blob);
                }
                
                // Wenn alle Methoden fehlschlagen, das Original verwenden
                if (!compressedBlob) {
                    console.warn('GIF-Komprimierung fehlgeschlagen, verwende Original');
                    compressedBlob = blob;
                }
                
                console.log(`GIF Größe: Original=${Math.round(blob.size/1024)}KB, Komprimiert=${Math.round(compressedBlob.size/1024)}KB`);
                
            } catch (error) {
                console.error('GIF-Komprimierungsversuche fehlgeschlagen:', error);
                showProgressUI('Fehler bei der GIF-Komprimierung. Versuche dennoch zu senden...', true);
                compressedBlob = blob;
            }
        } else {
            compressedBlob = await compressImage(blob);
        }
        
        showProgressUI('Bild wird gesendet...');
        
        // Bild zu Base64 konvertieren
        const base64String = await blobToBase64(compressedBlob);
        
        // Nachricht erstellen
        const messageData = {
            username: window.username,
            type: 'image',
            imageData: base64String,
            timestamp: Date.now(),
            color: window.userColor
        };
        
        // Zitat hinzufügen, falls vorhanden
        if (currentQuote) {
            messageData.quote = currentQuote;
            clearQuote();
        }
        
        // In die Datenbank schreiben
        await db.ref('messages').push(messageData);
        
        showProgressUI('Bild erfolgreich gesendet!');
        hideProgressUI(1500);
    } catch (error) {
        console.error('Fehler beim Bildupload:', error);
        showProgressUI('Fehler beim Senden des Bildes!', true);
        hideProgressUI(3000);
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