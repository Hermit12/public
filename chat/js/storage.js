// storage.js
let electronStore;

// Stattdessen Prüfen, ob wir im Electron-Kontext sind durch die Verfügbarkeit der 'electronAPI'
const isElectron = () => {
    return window.electronAPI !== undefined;
};

const Storage = {
    setItem: function(key, value) {
        try {
            if (isElectron()) {
                // Für Electron-Umgebung
                // Da wir keine direkte Verbindung zum Main-Prozess haben,
                // müssen wir eine alternative Speichermethode verwenden
                localStorage.setItem(key, value);
            } else {
                // Für Browser-Umgebung
                const d = new Date();
                d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
                const expires = "expires=" + d.toUTCString();
                document.cookie = key + "=" + value + ";" + expires + ";path=/";
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Einstellung:', key, error);
        }
    },

    getItem: function(key) {
        try {
            if (isElectron()) {
                // Für Electron-Umgebung
                return localStorage.getItem(key);
            } else {
                // Für Browser-Umgebung
                const name = key + "=";
                const decodedCookie = decodeURIComponent(document.cookie);
                const ca = decodedCookie.split(';');
                for(let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                    }
                }
                return "";
            }
        } catch (error) {
            console.error('Fehler beim Abrufen der Einstellung:', key, error);
            return "";
        }
    },

    removeItem: function(key) {
        try {
            if (isElectron()) {
                localStorage.removeItem(key);
            } else {
                document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            }
        } catch (error) {
            console.error('Fehler beim Entfernen der Einstellung:', key, error);
        }
    },

    clear: function() {
        try {
            if (isElectron()) {
                localStorage.clear();
            } else {
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            }
        } catch (error) {
            console.error('Fehler beim Löschen aller Einstellungen:', error);
        }
    }
};

// Globale Verfügbarkeit
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
} else {
    window.Storage = Storage;
}