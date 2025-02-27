// ===== gif-worker.js =====
// Worker für die GIF-Komprimierung mit Animation
importScripts('https://cdnjs.cloudflare.com/ajax/libs/omggif/1.0.10/omggif.min.js');
importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');

// Funktion zum Dekodieren eines GIFs
async function decodeGif(arrayBuffer) {
    try {
        const uint8Array = new Uint8Array(arrayBuffer);
        const reader = new GifReader(uint8Array);
        const frames = [];

        // Extrahiere jeden Frame des GIFs
        for (let i = 0; i < reader.numFrames(); i++) {
            const frameInfo = reader.frameInfo(i);
            const pixels = new Uint8Array(reader.width * reader.height * 4);
            reader.decodeAndBlitFrameRGBA(i, pixels);

            frames.push({
                data: new Uint8ClampedArray(pixels),
                delay: frameInfo.delay * 10, // Konvertiere zu Millisekunden
                disposal: frameInfo.disposal,
                transparent: frameInfo.transparent
            });
        }

        return {
            frames,
            width: reader.width,
            height: reader.height
        };
    } catch (error) {
        throw new Error('GIF-Dekodierungsfehler: ' + (error.message || 'Unbekannter Fehler'));
    }
}

// Hauptfunktion zur Verarbeitung der GIFs
self.onmessage = async function(e) {
    const { arrayBuffer, width, height, fpsReduction } = e.data;
    const MAX_SIZE = 1.5 * 1024 * 1024; // 1.5MB

    try {
        // GIF dekodieren
        self.postMessage({ type: 'progress', progress: 0.1, message: 'GIF wird dekodiert...' });
        const decodedGif = await decodeGif(arrayBuffer);
        
        // Qualitätseinstellungen basierend auf der Anzahl der Frames anpassen
        let quality = 10;
        if (decodedGif.frames.length > 50) {
            quality = 5; // Niedrigere Qualität für GIFs mit vielen Frames
        } else if (decodedGif.frames.length > 30) {
            quality = 7; // Mittlere Qualität
        }

        // Neuen GIF-Encoder mit optimierten Einstellungen erstellen
        const gif = new GIF({
            workers: 2,
            quality: quality,
            width: width || decodedGif.width,
            height: height || decodedGif.height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
            dither: false // Dithering deaktivieren für kleinere Dateigröße
        });

        // Fortschritts-Handler
        gif.on('progress', progress => {
            self.postMessage({ 
                type: 'progress', 
                progress: 0.1 + (progress * 0.8),
                message: `GIF wird erstellt: ${Math.round(progress * 100)}%`
            });
        });

        // Fertigstellungs-Handler
        gif.on('finished', blob => {
            self.postMessage({ 
                type: 'progress', 
                progress: 0.9,
                message: 'GIF-Erstellung fast abgeschlossen'
            });
            
            self.postMessage({ type: 'finished', result: blob });
        });

        // Canvas für Skalierung erstellen
        const canvas = new OffscreenCanvas(width || decodedGif.width, height || decodedGif.height);
        const ctx = canvas.getContext('2d');

        // Frames verarbeiten - wir nehmen nur jeden n-ten Frame, basierend auf fpsReduction
        self.postMessage({ type: 'progress', progress: 0.2, message: 'Frames werden verarbeitet...' });
        
        // Frame-Überspringen basierend auf der Gesamtanzahl anpassen
        let skipFactor = fpsReduction || 0;
        if (decodedGif.frames.length > 60) {
            skipFactor = Math.max(skipFactor, 2); // Mindestens jeden dritten Frame für sehr lange GIFs
        } else if (decodedGif.frames.length > 30) {
            skipFactor = Math.max(skipFactor, 1); // Mindestens jeden zweiten Frame für lange GIFs
        }

        for (let i = 0; i < decodedGif.frames.length; i += skipFactor + 1) {
            const frame = decodedGif.frames[i];

            // Frame-Daten in ImageData umwandeln
            const imageData = new ImageData(frame.data, decodedGif.width, decodedGif.height);
            
            // Frame auf temporärem Canvas zeichnen
            const tempCanvas = new OffscreenCanvas(decodedGif.width, decodedGif.height);
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imageData, 0, 0);

            // Frame auf skalierten Canvas zeichnen
            ctx.clearRect(0, 0, width || decodedGif.width, height || decodedGif.height);
            ctx.drawImage(tempCanvas, 0, 0, width || decodedGif.width, height || decodedGif.height);

            // Verzögerung anpassen, wenn Frames übersprungen werden
            const delay = frame.delay * (skipFactor + 1);

            // Frame zum GIF hinzufügen
            gif.addFrame(ctx, {
                copy: true,
                delay: delay,
                disposal: frame.disposal
            });
            
            // Fortschritt für jeden Frame aktualisieren
            if (i % 5 === 0 || i === decodedGif.frames.length - 1) {
                self.postMessage({ 
                    type: 'progress', 
                    progress: 0.2 + ((i / decodedGif.frames.length) * 0.4),
                    message: `Frame ${i+1}/${decodedGif.frames.length} wird verarbeitet`
                });
            }
        }

        // GIF rendern
        self.postMessage({ type: 'progress', progress: 0.6, message: 'GIF wird generiert...' });
        gif.render();

    } catch (error) {
        self.postMessage({
            type: 'error',
            error: 'GIF-Verarbeitungsfehler: ' + (error.message || 'Unbekannter Fehler')
        });
    }
};