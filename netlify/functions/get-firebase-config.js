/**
 * @fileoverview Netlify serverless function to securely provide
 * Firebase configuration to the client-side application.
 * It reads the configuration from environment variables.
 */

exports.handler = async function(event, context) {
    // Using the environment variable names you have set in your Netlify project.
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
    };

    // It's a good practice to check if the variables were loaded correctly.
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error. Firebase environment variables are not set." }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(firebaseConfig),
    };
};
