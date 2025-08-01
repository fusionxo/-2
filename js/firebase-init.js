import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    onSnapshot, 
    increment, 
    arrayUnion, 
    updateDoc, 
    getDocs, 
    collection, 
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Fetches the Firebase configuration from a secure serverless function.
 * @returns {Promise<object|null>} The Firebase configuration object, or null on failure.
 */
const getFirebaseConfig = async () => {
    try {
        const response = await fetch('/.netlify/functions/get-firebase-config');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch Firebase config');
        }
        return await response.json();
    } catch (error) {
        console.error("Could not load Firebase configuration:", error);
        return null;
    }
};

/**
 * Initializes Firebase after fetching the config and makes instances available.
 */
const initializeFirebase = async () => {
    const firebaseConfig = await getFirebaseConfig();

    if (!firebaseConfig) {
        console.error("Firebase initialization failed because config is missing.");
        // Optionally show an error to the user on the page
        document.body.innerHTML = '<div style="color: red; text-align: center; margin-top: 50px;">Error: Could not load app configuration. Please try again later.</div>';
        return;
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Make all necessary functions and services available on the window object.
    window.firebaseInstances = { 
        auth, db, onAuthStateChanged, signOut, sendPasswordResetEmail,
        createUserWithEmailAndPassword, signInWithEmailAndPassword,
        GoogleAuthProvider, signInWithPopup, doc, setDoc, onSnapshot,
        increment, arrayUnion, updateDoc, getDocs, collection, getDoc,
        serverTimestamp
    };

    // Dispatch a custom event to signal that Firebase is ready.
    document.dispatchEvent(new CustomEvent('firebase-ready'));
};

// Run the initialization process.
initializeFirebase();
