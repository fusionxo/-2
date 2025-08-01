/**
 * @fileoverview Handles the Recipe Generator, Cravings Solver, and Recipe Makeover tools.
 * This version uses a secure Netlify proxy and waits for Firebase to be ready.
 * @version 2.1.0
 */

document.addEventListener('firebase-ready', () => {
    'use strict';

    window.healthHub = window.healthHub || {};

    const dom = {
        ingredientsInput: document.getElementById('recipe-ingredients-input'),
        findRecipesBtn: document.getElementById('find-recipes-btn'),
        clearRecipesBtn: document.getElementById('clear-recipes-btn'),
        recipeResults: document.getElementById('recipe-results'),
        cravingInput: document.getElementById('craving-input'),
        solveCravingBtn: document.getElementById('solve-craving-btn'),
        clearCravingBtn: document.getElementById('clear-craving-btn'),
        cravingResults: document.getElementById('craving-results'),
        makeoverInput: document.getElementById('makeover-input'),
        makeoverBtn: document.getElementById('makeover-btn'),
        clearMakeoverBtn: document.getElementById('clear-makeover-btn'),
        makeoverResults: document.getElementById('makeover-results'),
    };

    /**
     * Calls our secure Netlify proxy function.
     * @param {string} prompt - The prompt to send.
     * @param {string} type - The category of the call ('analyzer', 'dashboard', etc.)
     * @returns {Promise<Object>} The JSON response from the proxy.
     */
    const callProxyApi = async (prompt, type) => {
        try {
            const response = await fetch('/api/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, type })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `Proxy Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to call proxy function:', error);
            throw error;
        }
    };
    
    const showStatus = (container, status, message = '') => {
        if (status === 'loading') {
            container.innerHTML = '<div class="loader mx-auto"></div>'; // Your loader HTML
        } else if (status === 'error') {
            container.innerHTML = `<div class="text-red-400 text-center">${message}</div>`;
        } else {
            container.innerHTML = '';
        }
    };
    
    const safeJsonParse = (text) => {
        try {
            const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error) {
            console.error("JSON Parsing Error:", error);
            throw new Error("The AI returned an invalid format. Please try again.");
        }
    };

    // --- Recipe Generator ---
    const handleFindRecipes = async () => {
        const ingredients = dom.ingredientsInput.value.trim();
        if (!ingredients) return;
        showStatus(dom.recipeResults, 'loading');
        dom.findRecipesBtn.disabled = true;
        try {
            const prompt = `Find 2 simple indian homemade recipes using: ${ingredients}. Respond with a valid JSON array. Each object must have "title", "ingredients" (array of strings), and "instructions" (array of strings). The response must be only the JSON array.`;
            const result = await callProxyApi(prompt, 'tools');
            if (!result.candidates || result.candidates.length === 0) {
                throw new Error("No recipes were generated. Please try again with ingredients separated by commas.");
            }
            const recipes = safeJsonParse(result.candidates[0].content.parts[0].text);
            renderRecipes(recipes);
        } catch (error) {
            showStatus(dom.recipeResults, 'error', error.message);
        } finally {
            dom.findRecipesBtn.disabled = false;
        }
    };

    const renderRecipes = (recipes) => {
        if (!Array.isArray(recipes)) {
            showStatus(dom.recipeResults, 'error', 'Received invalid recipe format.');
            return;
        }
        const recipesHTML = recipes.map(recipe => `
            <div class="card p-4 sm:p-6 bg-background-dark">
                <h4 class="text-xl font-bold text-primary mb-3">${recipe.title}</h4>
                <div class="mb-4">
                    <h5 class="font-semibold mb-2 text-main">Ingredients:</h5>
                    <ul class="list-disc list-inside text-sub space-y-1 text-sm">${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
                <div>
                    <h5 class="font-semibold mb-2 text-main">Instructions:</h5>
                    <ol class="list-decimal list-inside text-sub space-y-2 text-sm">${recipe.instructions.map(i => `<li>${i}</li>`).join('')}</ol>
                </div>
            </div>
        `).join('');
        dom.recipeResults.innerHTML = recipesHTML;
    };

    const handleClearRecipes = () => {
        dom.ingredientsInput.value = '';
        dom.recipeResults.innerHTML = '';
    };

    // --- Cravings Solver ---
    const handleSolveCraving = async () => {
        const craving = dom.cravingInput.value.trim();
        if (!craving) return;
        showStatus(dom.cravingResults, 'loading');
        dom.solveCravingBtn.disabled = true;
        try {
            const prompt = `I'm craving ${craving}. Suggest 2 healthy indian alternatives. Respond with a valid JSON array. Each object must have "name" and "description" (a brief, one-sentence explanation). The response must be only the JSON array.`;
            const result = await callProxyApi(prompt, 'tools');
            if (!result.candidates || result.candidates.length === 0) {
                throw new Error("No content was found.");
            }
            const alternatives = safeJsonParse(result.candidates[0].content.parts[0].text);
            renderCravingAlternatives(alternatives);
        } catch (error) {
            showStatus(dom.cravingResults, 'error', error.message);
        } finally {
            dom.solveCravingBtn.disabled = false;
        }
    };

    const renderCravingAlternatives = (alternatives) => {
        if (!Array.isArray(alternatives)) {
            showStatus(dom.cravingResults, 'error', 'Received invalid alternatives format.');
            return;
        }
        const alternativesHTML = alternatives.map(alt => `
            <div class="card p-4 bg-background-dark">
                <h4 class="font-bold text-primary">${alt.name}</h4>
                <p class="text-sub text-sm mt-1">${alt.description}</p>
            </div>
        `).join('');
        dom.cravingResults.innerHTML = alternativesHTML;
    };

    const handleClearCraving = () => {
        dom.cravingInput.value = '';
        dom.cravingResults.innerHTML = '';
    };

    // --- Recipe Makeover ---
    const handleMakeover = async () => {
        const ingredients = dom.makeoverInput.value.trim();
        if (!ingredients) return;
        showStatus(dom.makeoverResults, 'loading');
        dom.makeoverBtn.disabled = true;
        try {
            const prompt = `Analyze this recipe: "${ingredients}". Suggest 2-3 indian healthier swaps. Respond with a valid JSON object with two keys: "estimated_savings" (a string like "You could save up to 150 calories and 10g of fat.") and "swaps" (an array of objects, where each object has "original", "swap", and "notes"). The response must be only the JSON object.`;
            const result = await callProxyApi(prompt, 'tools');
            if (!result.candidates || result.candidates.length === 0) {
                throw new Error("No makeover suggestions were generated.");
            }
            const makeover = safeJsonParse(result.candidates[0].content.parts[0].text);
            renderMakeover(makeover);
        } catch (error) {
            showStatus(dom.makeoverResults, 'error', error.message);
        } finally {
            dom.makeoverBtn.disabled = false;
        }
    };

    const renderMakeover = (makeover) => {
        if (!makeover || !makeover.swaps) {
            showStatus(dom.makeoverResults, 'error', 'Received an invalid format for the makeover.');
            return;
        }
        const savingsHTML = makeover.estimated_savings ? `<div class="p-4 rounded-lg bg-primary/10 text-primary text-center font-semibold mb-4">${makeover.estimated_savings}</div>` : '';
        const swapsHTML = makeover.swaps.map(swap => `
            <div class="grid grid-cols-3 items-center gap-4 text-sm">
                <div class="text-center p-2 rounded bg-red-900/40">${swap.original}</div>
                <div class="text-center"><i data-lucide="arrow-right" class="w-5 h-5 mx-auto text-sub"></i></div>
                <div class="text-center p-2 rounded bg-green-900/40">${swap.swap}</div>
                <p class="col-span-3 text-xs text-sub text-center mt-1">${swap.notes}</p>
            </div>
        `).join('<hr class="border-zinc-700 my-4">');

        dom.makeoverResults.innerHTML = `
            <div class="card p-4 sm:p-6 bg-background-dark">
                ${savingsHTML}
                <div class="space-y-4">${swapsHTML}</div>
            </div>`;
        if (window.lucide) lucide.createIcons();
    };

    const handleClearMakeover = () => {
        dom.makeoverInput.value = '';
        dom.makeoverResults.innerHTML = '';
    };

    // --- Event Listeners ---
    if (dom.findRecipesBtn) dom.findRecipesBtn.addEventListener('click', handleFindRecipes);
    if (dom.clearRecipesBtn) dom.clearRecipesBtn.addEventListener('click', handleClearRecipes);

    if (dom.solveCravingBtn) dom.solveCravingBtn.addEventListener('click', handleSolveCraving);
    if (dom.clearCravingBtn) dom.clearCravingBtn.addEventListener('click', handleClearCraving);

    if (dom.makeoverBtn) dom.makeoverBtn.addEventListener('click', handleMakeover);
    if (dom.clearMakeoverBtn) dom.clearMakeoverBtn.addEventListener('click', handleClearMakeover);
});
