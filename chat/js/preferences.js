// preferences.js
const UserPreferences = {
    setPreference: function(key, value) {
        Storage.setItem(key, value);
    },

    getPreference: function(key) {
        return Storage.getItem(key);
    },

    saveUserPreferences: function(prefs) {
        Object.entries(prefs).forEach(([key, value]) => {
            this.setPreference(key, value);
        });
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
        Storage.clear();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserPreferences;
} else {
    window.UserPreferences = UserPreferences;
}