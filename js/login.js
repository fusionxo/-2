/**
 * @fileoverview Handles user login functionality.
 * This script now waits for a 'firebase-ready' event before executing.
 * @version 2.1.0
 */

document.addEventListener('firebase-ready', () => {
    // All code is now safely inside this event listener
    const {
        auth,
        db,
        onAuthStateChanged,
        signInWithEmailAndPassword,
        sendPasswordResetEmail,
        GoogleAuthProvider,
        signInWithPopup,
        doc,
        getDoc,
        setDoc,
        serverTimestamp
    } = window.firebaseInstances;

    const pageLoader = document.getElementById('page-loader');
    const loginContainer = document.getElementById('login-container');
    const loginForm = document.getElementById('login-form');
    const alertBox = document.getElementById('alert-box');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const loginBtn = document.getElementById('login-btn');
    const googleSignInBtn = document.getElementById('google-signin-btn');
    const btnText = document.getElementById('btn-text');
    const loader = document.getElementById('loader');

    const showAlert = (message, type = 'error') => {
        alertBox.textContent = message;
        alertBox.classList.remove('hidden', 'bg-red-900/50', 'text-red-300', 'bg-green-900/50', 'text-green-300');
        const typeClass = type === 'error' ? ['bg-red-900/50', 'text-red-300'] : ['bg-green-900/50', 'text-green-300'];
        alertBox.classList.add(...typeClass);
    };

    const setLoading = (isLoading) => {
        loginBtn.disabled = isLoading;
        googleSignInBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    };

    const handleUserRedirect = async (user) => {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        localStorage.setItem('calverseUid', user.uid);

        if (docSnap.exists() && docSnap.data().profileComplete) {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'welcomepage.html';
        }
    };

    onAuthStateChanged(auth, (user) => {
        if (user) {
            handleUserRedirect(user);
        } else {
            localStorage.removeItem('calverseUid');
            pageLoader.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            alertBox.classList.add('hidden');
            setLoading(true);

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                showAlert('Login successful! Redirecting...', 'success');
                // No need to call handleUserRedirect here, onAuthStateChanged will do it.
            } catch (error) {
                showAlert("Invalid credentials. Please try again.", 'error');
                setLoading(false);
            }
        });
    }

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            const provider = new GoogleAuthProvider();
            alertBox.classList.add('hidden');
            setLoading(true);

            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);

                if (!docSnap.exists()) {
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email,
                        createdAt: serverTimestamp(),
                        profileComplete: false,
                        premium: "no"
                    });
                }
                showAlert('Login successful! Redirecting...', 'success');
                // No need to call handleUserRedirect here, onAuthStateChanged will do it.
            } catch (error) {
                showAlert("Could not sign in with Google. Please try again.", 'error');
                setLoading(false);
            }
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            if (!email) {
                showAlert('Please enter your email address to reset your password.', 'error');
                return;
            }
            try {
                await sendPasswordResetEmail(auth, email);
                showAlert('Password reset email sent! Please check your inbox.', 'success');
            } catch (error) {
                showAlert('Could not send reset email. Please check the address.', 'error');
            }
        });
    }
});
