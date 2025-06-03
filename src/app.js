let currentScript = null;
let scripts = [];
let aiImprovedContent = '';

// Initialize the app
async function initApp() {
    // Load existing scripts from cloud storage using Puter's key-value store to retrieve script metadata
    await loadScripts();
    showWelcome();
}

// Load scripts from cloud storage
async function loadScripts() {
    try {
        /**
         * PUTER.JS TUTORIAL: Key-Value Store Listing
         * puter.kv.list() retrieves all keys matching a pattern from Puter's cloud key-value store.
         * This is useful for listing all items of a certain type without needing to manage a separate index.
         * The pattern 'script_*' will match all keys that start with 'script_', giving us all saved scripts.
         */
        const scriptKeys = await puter.kv.list('script_*');
        scripts = [];
        
        for (let key of scriptKeys) {
            /**
             * PUTER.JS TUTORIAL: Key-Value Store Retrieval
             * puter.kv.get() fetches the value associated with a specific key from Puter's cloud storage.
             * This provides a simple way to retrieve stored data without managing database connections.
             * The data is automatically synced across all user devices and sessions.
             */
            const scriptData = await puter.kv.get(key);
            if (scriptData) {
                scripts.push(JSON.parse(scriptData));
            }
        }
        
        displayScriptsList();
    } catch (error) {
        console.error('Error loading scripts:', error);
    }
}

// Display scripts list in sidebar
function displayScriptsList() {
    const listContainer = document.getElementById('scriptsList');
    listContainer.innerHTML = '';
    
    if (scripts.length === 0) {
        listContainer.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No scripts yet. Create your first script!</p>';
        return;
    }
    
    scripts.forEach((script, index) => {
        const scriptItem = document.createElement('div');
        scriptItem.className = 'script-item';
        scriptItem.onclick = () => viewScript(script);
        
        scriptItem.innerHTML = `
            <div class="script-title">${script.title}</div>
            <div class="script-genre">${script.genre} • Created: ${new Date(script.createdAt).toLocaleDateString()}</div>
        `;
        
        listContainer.appendChild(scriptItem);
    });
}

// Show different screens
function showWelcome() {
    hideAllScreens();
    document.getElementById('welcomeScreen').classList.remove('hidden');
}

function showNewScriptForm() {
    hideAllScreens();
    document.getElementById('newScriptForm').classList.remove('hidden');
    clearForm();
}

function showGuide() {
    hideAllScreens();
    document.getElementById('guideScreen').classList.remove('hidden');
}

function hideAllScreens() {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('newScriptForm').classList.add('hidden');
    document.getElementById('scriptViewer').classList.add('hidden');
    document.getElementById('guideScreen').classList.add('hidden');
}

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Clear form
function clearForm() {
    document.getElementById('scriptTitle').value = '';
    document.getElementById('scriptGenre').value = 'drama';
    document.getElementById('scriptLogline').value = '';
    document.getElementById('scriptSynopsis').value = '';
    document.getElementById('scriptContentArea').value = '';
    document.getElementById('improvementType').value = 'dialogue';
    document.getElementById('aiInstructions').value = '';
    hideAISuggestions();
    currentScript = null;
}

// AI Help for individual fields
async function aiHelpField(fieldId, fieldType) {
    const field = document.getElementById(fieldId);
    const currentValue = field.value.trim();
    
    if (!currentValue) {
        alert('Please enter some initial content first, then AI can help improve it.');
        return;
    }
    
    // Show loading state on button
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="mini-spinner"></span>Improving...';
    button.disabled = true;
    
    try {
        let prompt = '';
        
        switch(fieldType) {
            case 'title':
                /**
                 * PUTER.JS TUTORIAL: AI Prompt Construction
                 * Here we're crafting a detailed prompt for Puter's AI service.
                 * Well-structured prompts with clear instructions produce better results.
                 * This prompt includes role definition, specific task instructions, and output format guidance.
                 */
                prompt = `You are a professional screenwriter. Take this basic script title idea: "${currentValue}" and create 3 improved, more compelling and professional script titles. Make them catchy and appropriate for a screenplay. Return only the titles, one per line.`;
                break;
            case 'logline':
                // Use Puter AI to create a professional logline from user's rough idea
                prompt = `You are a professional screenwriter. Take this rough logline idea: "${currentValue}" and turn it into a compelling, professional one-sentence logline for a screenplay. A good logline should include the protagonist, the central conflict, and what's at stake. Make it intriguing and marketable.`;
                break;
            case 'synopsis':
                // Use Puter AI to expand and enhance the synopsis based on user's basic description
                prompt = `You are a professional screenwriter. Take this basic story synopsis: "${currentValue}" and expand it into a well-structured, compelling synopsis for a screenplay. Include main characters, the three-act structure, key plot points, and the resolution. Keep it concise but engaging, around 150-200 words.`;
                break;
            case 'script':
                // Use Puter AI to improve script content with proper formatting and enhanced dialogue/action
                prompt = `You are a professional screenwriter. Take this script content: "${currentValue}" and improve it by enhancing the dialogue, action lines, and ensuring proper screenplay format. Maintain the original story and characters but make the writing more professional and engaging. Use proper screenplay format with scene headings, action lines, character names, and dialogue.`;
                break;
        }
        
        /**
         * PUTER.JS TUTORIAL: AI Chat Integration
         * puter.ai.chat() provides access to Puter's AI capabilities directly from your app.
         * It takes a prompt string and returns the AI-generated response as a string.
         * This allows you to integrate AI assistance without managing API keys or complex configurations.
         * The service handles context management, token limits, and response formatting automatically.
         */
        const response = await puter.ai.chat(prompt);
        
        // Show suggestions to user
        const suggestion = document.createElement('div');
        suggestion.className = 'ai-suggestion';
        suggestion.innerHTML = `
            <h4>AI Suggestions:</h4>
            <div style="white-space: pre-wrap; margin: 10px 0;">${response}</div>
            <button class="btn btn-ai-small" onclick="applySuggestion('${fieldId}', this.previousElementSibling.textContent)">Apply</button>
            <button class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px;" onclick="this.parentElement.remove()">Dismiss</button>
        `;
        
        // Insert suggestion after the input field
        field.parentElement.parentElement.appendChild(suggestion);
        
    } catch (error) {
        console.error('Error with AI field help:', error);
        alert('Error getting AI suggestions. Please try again.');
    } finally {
        // Restore button state
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Apply AI suggestion to field
function applySuggestion(fieldId, suggestion) {
    const field = document.getElementById(fieldId);
    field.value = suggestion.trim();
    // Remove the suggestion element
    event.target.parentElement.remove();
}

// Save script to cloud
async function saveScript() {
    const title = document.getElementById('scriptTitle').value.trim();
    const genre = document.getElementById('scriptGenre').value;
    const logline = document.getElementById('scriptLogline').value.trim();
    const synopsis = document.getElementById('scriptSynopsis').value.trim();
    const content = document.getElementById('scriptContentArea').value.trim();
    
    if (!title) {
        alert('Please enter a script title');
        return;
    }
    
    const scriptData = {
        id: currentScript ? currentScript.id : Date.now().toString(),
        title,
        genre,
        logline,
        synopsis,
        content,
        createdAt: currentScript ? currentScript.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        /**
         * PUTER.JS TUTORIAL: Key-Value Store Writing
         * puter.kv.set() stores data in Puter's cloud key-value store.
         * It takes two parameters: a unique key string and the value to store (must be a string).
         * Here we're using JSON.stringify() to convert our JavaScript object to a string.
         * This provides persistent cloud storage without requiring database setup.
         */
        await puter.kv.set(`script_${scriptData.id}`, JSON.stringify(scriptData));
        
        // Update local scripts array
        if (currentScript) {
            const index = scripts.findIndex(s => s.id === currentScript.id);
            scripts[index] = scriptData;
        } else {
            scripts.push(scriptData);
        }
        
        displayScriptsList();
        alert('Script saved successfully!');
        viewScript(scriptData);
    } catch (error) {
        console.error('Error saving script:', error);
        alert('Error saving script. Please try again.');
    }
}

// View script
function viewScript(script) {
    currentScript = script;
    hideAllScreens();
    
    document.getElementById('scriptViewer').classList.remove('hidden');
    document.getElementById('viewerTitle').textContent = script.title;
    
    document.getElementById('scriptDetails').innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <p><strong>Genre:</strong> ${script.genre}</p>
            <p><strong>Logline:</strong> ${script.logline}</p>
            <p><strong>Synopsis:</strong> ${script.synopsis}</p>
            <p><strong>Created:</strong> ${new Date(script.createdAt).toLocaleDateString()}</p>
            <p><strong>Last Updated:</strong> ${new Date(script.updatedAt).toLocaleDateString()}</p>
        </div>
    `;
    
    document.getElementById('scriptText').innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; font-family: 'Courier New', monospace; white-space: pre-wrap; line-height: 1.6; border: 2px solid #e0e0e0;">
            ${script.content || 'No content yet.'}
        </div>
    `;
    
    // Update sidebar selection
    document.querySelectorAll('.script-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Edit script
function editScript() {
    if (!currentScript) return;
    
    document.getElementById('scriptTitle').value = currentScript.title;
    document.getElementById('scriptGenre').value = currentScript.genre;
    document.getElementById('scriptLogline').value = currentScript.logline;
    document.getElementById('scriptSynopsis').value = currentScript.synopsis;
    document.getElementById('scriptContentArea').value = currentScript.content;
    
    showNewScriptForm();
}

// Delete script
async function deleteScript() {
    if (!currentScript) return;
    
    if (confirm(`Are you sure you want to delete "${currentScript.title}"?`)) {
        try {
            /**
             * PUTER.JS TUTORIAL: Key-Value Store Deletion
             * puter.kv.delete() removes a specific key-value pair from Puter's cloud storage.
             * This is used for permanent data removal when an item is no longer needed.
             * The operation is asynchronous and returns a Promise that resolves when deletion is complete.
             */
            await puter.kv.delete(`script_${currentScript.id}`);
            
            // Remove from local array
            scripts = scripts.filter(s => s.id !== currentScript.id);
            displayScriptsList();
            showWelcome();
            alert('Script deleted successfully!');
        } catch (error) {
            console.error('Error deleting script:', error);
            alert('Error deleting script. Please try again.');
        }
    }
}

// AI Improvement (Fixed version)
async function improveWithAI() {
    const content = document.getElementById('scriptContentArea').value.trim();
    const improvementType = document.getElementById('improvementType').value;
    const instructions = document.getElementById('aiInstructions').value.trim();
    
    if (!content) {
        alert('Please add some script content first');
        return;
    }
    
    document.getElementById('aiLoading').style.display = 'block';
    hideAISuggestions();
    
    try {
        let prompt = `You are a professional script doctor and screenwriter. Please help improve this screenplay script by focusing on ${improvementType}. 

Here is the current script:
${content}

Instructions: ${instructions || 'Make general improvements while maintaining the original story and vision.'}

Please provide specific, actionable improvements. Stay true to the original concept and don't change the core story. Focus on enhancing what's already there rather than rewriting completely.

Return the improved version of the script, maintaining proper screenplay format.`;

        // Use Puter's AI chat service to get script improvement suggestions
        const response = await puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
        
        aiImprovedContent = response;
        document.getElementById('aiResult').innerHTML = `
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 15px;">
                <h4>Improved Script:</h4>
                <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; line-height: 1.4; max-height: 300px; overflow-y: auto;">${response}</pre>
            </div>
        `;
        
        document.getElementById('aiLoading').style.display = 'none';
        document.getElementById('aiSuggestions').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error with AI improvement:', error);
        document.getElementById('aiLoading').style.display = 'none';
        alert('Error getting AI suggestions. Please try again.');
    }
}

// Apply AI suggestions
function applyAISuggestions() {
    if (aiImprovedContent) {
        document.getElementById('scriptContentArea').value = aiImprovedContent;
        hideAISuggestions();
        alert('AI suggestions applied! Don\'t forget to save your script.');
    }
}

// Hide AI suggestions
function hideAISuggestions() {
    document.getElementById('aiSuggestions').classList.add('hidden');
    aiImprovedContent = '';
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', initApp);