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
 * This avoids exposing the configuration directly in the client-side code.
 * @returns {Promise<object|null>} The Firebase configuration object, or null on failure.
 */
const getFirebaseConfig = async () => {
    try {
        // This path corresponds to the Netlify function you have open.
        const response = await fetch('/.netlify/functions/get-firebase-config');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch Firebase config');
        }
        return await response.json();
    } catch (error) {
        console.error("Could not load Firebase configuration:", error);
        // Optionally, display a user-facing error message on the page.
        return null;
    }
};

/**
 * Initializes Firebase after fetching the config and exports all necessary 
 * instances and functions to the global window object.
 * This function is self-invoking.
 */
const initializeFirebase = async () => {
    const firebaseConfig = await getFirebaseConfig();

    // Stop initialization if the config couldn't be loaded.
    if (!firebaseConfig) {
        console.error("Firebase initialization failed because config is missing.");
        // You might want to show an error message to the user here.
        return;
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Export ALL the functions and services your other scripts (login.js, register.js) will need.
    window.firebaseInstances = { 
        // Core services
        auth, 
        db, 

        // Auth functions
        onAuthStateChanged, 
        signOut, 
        sendPasswordResetEmail,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        GoogleAuthProvider,
        signInWithPopup,

        // Firestore functions
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
    };

    // Dispatch a custom event to let other scripts know that Firebase is ready.
    // This is a robust way to handle initialization timing.
    document.dispatchEvent(new CustomEvent('firebase-ready'));
};

// Run the initialization process.
initializeFirebase();
