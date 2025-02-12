// Cookie Management
const COOKIE_EXPIRY = 365; // Tage

const UserPreferences = {
    setPreference: function(key, value) {
        const d = new Date();
        d.setTime(d.getTime() + (COOKIE_EXPIRY * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = key + "=" + value + ";" + expires + ";path=/";
    },

    getPreference: function(key) {
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
    },

    saveUserPreferences: function(prefs) {
        this.setPreference('username', prefs.username);
        this.setPreference('userColor', prefs.userColor);
        this.setPreference('fontFamily', prefs.fontFamily);
        this.setPreference('textColor', prefs.textColor);
        this.setPreference('fontSize', prefs.fontSize);
        this.setPreference('fontWeight', prefs.fontWeight);
        this.setPreference('fontStyle', prefs.fontStyle);
    },

    loadUserPreferences: function() {
        return {
            username: this.getPreference('username'),
            userColor: this.getPreference('userColor') || '#e3f2fd',
            fontFamily: this.getPreference('fontFamily') || 'Arial',
            textColor: this.getPreference('textColor') || '#000000',
            fontSize: this.getPreference('fontSize') || '14px',
            fontWeight: this.getPreference('fontWeight') || 'normal',
            fontStyle: this.getPreference('fontStyle') || 'normal'
        };
    },

    clearPreferences: function() {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
    }
};
