// storage.js
const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;
let electronStore;

if (isElectron) {
    const Store = require('electron-store');
    electronStore = new Store();
}

const Storage = {
    setItem: function(key, value) {
        if (isElectron) {
            electronStore.set(key, value);
        } else {
            const d = new Date();
            d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
            const expires = "expires=" + d.toUTCString();
            document.cookie = key + "=" + value + ";" + expires + ";path=/";
        }
    },

    getItem: function(key) {
        if (isElectron) {
            return electronStore.get(key);
        } else {
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
    },

    removeItem: function(key) {
        if (isElectron) {
            electronStore.delete(key);
        } else {
            document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
    },

    clear: function() {
        if (isElectron) {
            electronStore.clear();
        } else {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
} else {
    window.Storage = Storage;
}