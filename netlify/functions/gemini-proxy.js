// /netlify/functions/gemini-proxy.js

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt, base64Image, type } = JSON.parse(event.body);

        // --- Key Organization & Selection ---
        // Your existing logic for organizing keys by type is excellent.
        const apiKeys = {
            analyzer: [process.env.ANALYZER_GEM_1, process.env.ANALYZER_GEM_2, process.env.ANALYZER_GEM_3],
            dashboard: [process.env.DASHBOARD_GEM_1, process.env.DASHBOARD_GEM_2, process.env.DASHBOARD_GEM_3],
            food: [process.env.FOOD_GEM_1, process.env.FOOD_GEM_2, process.env.FOOD_GEM_3],
            tools: [process.env.TOOLS_GEM_1, process.env.TOOLS_GEM_2, process.env.TOOLS_GEM_3],
        };

        const keysForType = (apiKeys[type] || apiKeys.dashboard).filter(Boolean);

        if (keysForType.length === 0) {
            throw new Error(`No API keys configured on the server for function type: ${type}`);
        }

        // --- Dynamic Model Selection ---
        // Use the vision model if an image is included, otherwise use the standard model.
        const model = base64Image ? 'gemini-pro-vision' : 'gemini-1.5-flash-latest';
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
        };

        if (base64Image) {
            requestBody.contents[0].parts.push({
                inline_data: { mime_type: "image/jpeg", data: base64Image }
            });
        }

        // --- Key Failover Logic ---
        // Your loop to try each key until one succeeds is a great approach.
        let lastError;
        for (const apiKey of keysForType) {
            try {
                // Dynamically import node-fetch as it's an external dependency
                const fetch = (await import('node-fetch')).default;
                
                const response = await fetch(`${geminiApiUrl}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (response.ok) {
                    const data = await response.json();
                    return { statusCode: 200, body: JSON.stringify(data) };
                }
                
                // If we get here, the response was not ok (e.g., 4xx or 5xx error from Google)
                lastError = `API Error with status: ${response.status} using key ending in ...${apiKey.slice(-4)}`;

            } catch (error) {
                // This catches network errors or other issues with the fetch call itself.
                lastError = `Network or fetch error: ${error.message}`;
                continue; // Move to the next key
            }
        }

        // If the loop finishes without a successful response
        throw new Error(`All API key attempts failed. Last error: ${lastError}`);

    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: { message: error.message } })
        };
    }
};
