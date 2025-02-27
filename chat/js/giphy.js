// Giphy Integration mit verbesserter GIF-Verarbeitung
let selectedGif = null;
const giphyModal = document.getElementById('giphyModal');
const giphySearchInput = document.getElementById('giphySearchInput');
const giphyResults = document.getElementById('giphyResults');

function openGiphyModal() {
    giphyModal.style.display = 'block';
    giphySearchInput.focus();
    showGiphyLoading();
    
    // Initial-Suche nach trending GIFs
    searchGiphy('trending');
}

function closeGiphyModal() {
    giphyModal.style.display = 'none';
    selectedGif = null;
}

function showGiphyLoading() {
    giphyResults.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1); 
                       border-radius: 50%; border-top-color: #2196F3; animation: spin 1s ease-in-out infinite;"></div>
            <div style="margin-top: 15px; font-size: 14px; color: #666;">Lade GIFs...</div>
        </div>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    `;
}

function showGiphyError(message) {
    giphyResults.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 24px; margin-bottom: 10px; color: #ff4444;">⚠️</div>
            <div style="font-size: 14px; color: #666;">${message}</div>
            <button id="retryButton" style="margin-top: 15px; padding: 8px 16px; background: #2196F3; 
                    color: white; border: none; border-radius: 4px; cursor: pointer;">
                Erneut versuchen
            </button>
        </div>
    `;
    
    document.getElementById('retryButton').onclick = () => searchGiphy();
}

async function searchGiphy(type = 'search') {
    showGiphyLoading();
    
    const searchTerm = giphySearchInput.value.trim();
    let apiUrl;

    if (type === 'trending' || !searchTerm) {
        apiUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;
    } else {
        apiUrl = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=20&rating=g`;
    }

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            displayGiphyResults(data.data);
        } else {
            giphyResults.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 24px; margin-bottom: 10px; color: #666;">🔍</div>
                    <div style="font-size: 14px; color: #666;">Keine GIFs gefunden. Versuche einen anderen Suchbegriff.</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Fehler bei der Giphy-Suche:', error);
        showGiphyError('Fehler beim Laden der GIFs. Bitte versuche es später erneut.');
    }
}

function displayGiphyResults(gifs) {
    giphyResults.innerHTML = '';

    // Besseres Layout mit Flexbox
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '10px';
    container.style.justifyContent = 'center';
    container.style.padding = '10px';
    
    gifs.forEach(gif => {
        // Bessere Vorschau mit fester Größe für gleichmäßiges Layout
        const gifItem = document.createElement('div');
        gifItem.className = 'giphy-item';
        gifItem.style.position = 'relative';
        gifItem.style.width = '170px';
        gifItem.style.height = '170px';
        gifItem.style.overflow = 'hidden';
        gifItem.style.borderRadius = '8px';
        gifItem.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        gifItem.style.cursor = 'pointer';
        gifItem.style.transition = 'transform 0.2s, box-shadow 0.2s';
        
        // Hover-Effekt
        gifItem.onmouseenter = () => {
            gifItem.style.transform = 'translateY(-3px)';
            gifItem.style.boxShadow = '0 5px 15px rgba(0,0,0,0.15)';
        };
        
        gifItem.onmouseleave = () => {
            gifItem.style.transform = '';
            gifItem.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        };

        // Optimiertes GIF laden
        const img = document.createElement('img');
        img.src = gif.images.fixed_height_small.url; // Kleineres GIF für Vorschau
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.alt = gif.title || 'GIF';
        
        // Größenlabel
        const originalSize = Math.round((parseInt(gif.images.original.size) || 100000) / 1024) / 1024;
        const sizeIndicator = document.createElement('div');
        sizeIndicator.style.position = 'absolute';
        sizeIndicator.style.bottom = '5px';
        sizeIndicator.style.right = '5px';
        sizeIndicator.style.padding = '3px 6px';
        sizeIndicator.style.borderRadius = '3px';
        sizeIndicator.style.fontSize = '10px';
        sizeIndicator.style.fontWeight = 'bold';
        sizeIndicator.style.color = 'white';
        
        // Farbkodierung für Größe
        let bgColor = '#4CAF50'; // Grün für kleine GIFs
        if (originalSize > 5) {
            bgColor = '#F44336'; // Rot für große GIFs
        } else if (originalSize > 2) {
            bgColor = '#FF9800'; // Orange für mittlere GIFs
        }
        
        sizeIndicator.style.backgroundColor = bgColor;
        sizeIndicator.textContent = originalSize.toFixed(1) + ' MB';
        
        // Klick-Handler mit Lade-Animation
        gifItem.onclick = () => {
            // Lade-Overlay erstellen
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.color = 'white';
            overlay.style.borderRadius = '8px';
            overlay.style.zIndex = '10';
            
            const spinner = document.createElement('div');
            spinner.style.width = '30px';
            spinner.style.height = '30px';
            spinner.style.border = '3px solid rgba(255,255,255,0.3)';
            spinner.style.borderRadius = '50%';
            spinner.style.borderTopColor = 'white';
            spinner.style.animation = 'spin 1s ease-in-out infinite';
            
            const text = document.createElement('div');
            text.style.marginTop = '10px';
            text.style.fontSize = '12px';
            text.textContent = 'Wird geladen...';
            
            overlay.appendChild(spinner);
            overlay.appendChild(text);
            gifItem.appendChild(overlay);
            
            // GIF auswählen
            selectGif(gif).catch(error => {
                console.error('Fehler beim Auswählen des GIFs:', error);
                overlay.innerHTML = `
                    <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                    <div style="font-size: 12px; text-align: center; padding: 0 5px;">Fehler</div>
                `;
                
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 2000);
            });
        };

        gifItem.appendChild(img);
        gifItem.appendChild(sizeIndicator);
        container.appendChild(gifItem);
    });
    
    giphyResults.appendChild(container);
    
    // Attributionszeile hinzufügen
    const attribution = document.createElement('div');
    attribution.style.textAlign = 'center';
    attribution.style.padding = '10px';
    attribution.style.fontSize = '12px';
    attribution.style.color = '#666';
    attribution.style.marginTop = '10px';
    attribution.innerHTML = 'Powered by <a href="https://giphy.com/" target="_blank" style="color: #2196F3; text-decoration: none;">GIPHY</a>';
    giphyResults.appendChild(attribution);
}

async function selectGif(gif) {
    try {
        closeGiphyModal();
        
        // Fortschrittsmeldung anzeigen
        const progressElement = showProgressUI('GIF wird geladen...');
        
        // Verwende die optimierte Version des GIFs anstatt der Original-Version
        let gifUrl;
        const originalSize = parseInt(gif.images.original.size) || 1000000;
        
        // Beste Version basierend auf der Größe auswählen
        if (originalSize > 5 * 1024 * 1024) { // > 5MB
            gifUrl = gif.images.fixed_height.url; // 200px Höhe
        } else if (originalSize > 2 * 1024 * 1024) { // > 2MB
            gifUrl = gif.images.downsized_medium.url; 
        } else if (originalSize > 1 * 1024 * 1024) { // > 1MB
            gifUrl = gif.images.downsized.url;
        } else {
            gifUrl = gif.images.original.url;
        }
        
        // GIF herunterladen
        showProgressUI('GIF wird heruntergeladen...');
        const response = await fetch(gifUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP-Fehler beim Laden des GIFs: ${response.status}`);
        }
        
        const blob = await response.blob();
        showProgressUI('GIF wird verarbeitet...');
        
        // GIF verarbeiten und senden
        await uploadAndSendImage(blob);
        
    } catch (error) {
        console.error('Fehler beim Senden des GIFs:', error);
        showProgressUI('Fehler beim Senden des GIFs. Bitte versuche es erneut.', true);
        hideProgressUI(3000);
    }
}

// Event Listener
document.addEventListener('DOMContentLoaded', () => {
    if (!giphyModal) return;
    
    // Schließen-Button im Giphy Modal
    const giphyCloseBtn = giphyModal.querySelector('.close');
    if (giphyCloseBtn) {
        giphyCloseBtn.onclick = closeGiphyModal;
    }

    // Modal außerhalb klicken zum Schließen
    giphyModal.onclick = (e) => {
        if (e.target === giphyModal) {
            closeGiphyModal();
        }
    };

    // Suche bei Enter-Taste
    if (giphySearchInput) {
        giphySearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchGiphy();
            }
        });
    }
});