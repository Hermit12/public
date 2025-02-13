let selectedGif = null;
const giphyModal = document.getElementById('giphyModal');
const giphySearchInput = document.getElementById('giphySearchInput');
const giphyResults = document.getElementById('giphyResults');

function openGiphyModal() {
    giphyModal.style.display = 'block';
    giphySearchInput.focus();
    // Initial-Suche nach trending GIFs
    searchGiphy('trending');
}

function closeGiphyModal() {
    giphyModal.style.display = 'none';
    selectedGif = null;
}

async function searchGiphy(type = 'search') {
    const searchTerm = giphySearchInput.value.trim();
    let apiUrl;

    if (type === 'trending' || !searchTerm) {
        apiUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=50&rating=g`;
    } else {
        apiUrl = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=50&rating=g`;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        displayGiphyResults(data.data);
    } catch (error) {
        console.error('Fehler bei der Giphy-Suche:', error);
        giphyResults.innerHTML = '<p>Fehler beim Laden der GIFs. Bitte versuchen Sie es später erneut.</p>';
    }
}

function displayGiphyResults(gifs) {
    giphyResults.innerHTML = '';

    gifs.forEach(gif => {
        const gifItem = document.createElement('div');
        gifItem.className = 'giphy-item';

        const img = document.createElement('img');
        // Preview-Version des GIFs laden (kleiner und schneller)
        img.src = gif.images.fixed_height.url;
        img.alt = gif.title;

        gifItem.onclick = () => selectGif(gif);
        gifItem.appendChild(img);
        giphyResults.appendChild(gifItem);
    });
}

async function selectGif(gif) {
    try {
        // Original-GIF URL verwenden
        const gifUrl = gif.images.original.url;

        // GIF herunterladen
        const response = await fetch(gifUrl);
        const blob = await response.blob();

        // GIF senden
        await uploadAndSendImage(blob);

        // Modal schließen
        closeGiphyModal();
    } catch (error) {
        console.error('Fehler beim Senden des GIFs:', error);
        alert('Fehler beim Senden des GIFs. Bitte versuchen Sie es erneut.');
    }
}

// Event Listener
document.addEventListener('DOMContentLoaded', () => {
    // Schließen-Button im Giphy Modal
    const giphyCloseBtn = giphyModal.querySelector('.close');
    giphyCloseBtn.onclick = closeGiphyModal;

    // Modal außerhalb klicken zum Schließen
    giphyModal.onclick = (e) => {
        if (e.target === giphyModal) {
            closeGiphyModal();
        }
    };

    // Suche bei Enter-Taste
    giphySearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchGiphy();
        }
    });
});
