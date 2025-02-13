// ===== gif-worker.js =====
importScripts('https://cdnjs.cloudflare.com/ajax/libs/omggif/1.0.10/omggif.min.js');
importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');

async function decodeGif(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const reader = new GifReader(uint8Array);
    const frames = [];

    for (let i = 0; i < reader.numFrames(); i++) {
        const frameInfo = reader.frameInfo(i);
        const pixels = new Uint8Array(reader.width * reader.height * 4);
        reader.decodeAndBlitFrameRGBA(i, pixels);

        frames.push({
            data: new ImageData(new Uint8ClampedArray(pixels), reader.width, reader.height),
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
}

self.onmessage = async function(e) {
    const { arrayBuffer, width, height, fpsReduction } = e.data;

    try {
        // GIF dekodieren
        const decodedGif = await decodeGif(arrayBuffer);

        // Neuen GIF-Encoder mit skalierten Dimensionen erstellen
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: width,
            height: height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
        });

        // Fortschritts-Handler
        gif.on('progress', progress => {
            self.postMessage({ type: 'progress', progress });
        });

        // Fertigstellungs-Handler
        gif.on('finished', blob => {
            self.postMessage({ type: 'finished', result: blob });
        });

        // Canvas für Skalierung erstellen
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Frames verarbeiten
        for (let i = 0; i < decodedGif.frames.length; i += fpsReduction) {
            const frame = decodedGif.frames[i];

            // Frame auf Canvas zeichnen und skalieren
            const tempCanvas = new OffscreenCanvas(decodedGif.width, decodedGif.height);
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(frame.data, 0, 0);

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(tempCanvas, 0, 0, width, height);

            // Frame zum GIF hinzufügen
            gif.addFrame(ctx, {
                copy: true,
                delay: frame.delay * fpsReduction,
                disposal: frame.disposal
            });
        }

        // GIF rendern
        gif.render();

    } catch (error) {
        self.postMessage({
            type: 'error',
            error: 'GIF-Verarbeitungsfehler: ' + (error.message || 'Unbekannter Fehler')
        });
    }
};
