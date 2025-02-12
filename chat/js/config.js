// Firebase Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyAEJCuP5Z1S-g0VoJzzhV50R-oeuKLa58M",
    authDomain: "chat-8509a.firebaseapp.com",
    databaseURL: "https://chat-8509a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "chat-8509a",
    storageBucket: "chat-8509a.firebasestorage.app",
    messagingSenderId: "183026187271",
    appId: "1:183026187271:web:fb14822796e08dbb417ea2"
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Globale Variablen für Chat-Status
let username = '';
let userColor = '';
let currentQuote = null;
