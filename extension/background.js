const SF_TOOLBOX_URL = 'http://localhost:3000';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openToolbox') {
        console.log('Received openToolbox request for domain:', request.domain);
        handleToolboxOpen(request.domain);
    }
});

async function handleToolboxOpen(domain) {
    try {
        // Get all tabs to find the current tab's index
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const currentTab = tabs.find(tab => tab.active);
        
        if (!currentTab) {
            console.error('No active tab found');
            return;
        }

        console.log('Current tab index:', currentTab.index);

        // Create check page directly next to current tab
        const checkUrl = new URL(`${SF_TOOLBOX_URL}/auth/check`);
        checkUrl.searchParams.set('domain', domain);
        
        chrome.tabs.create({
            url: checkUrl.toString(),
            active: true,
            index: currentTab.index + 1  // This should place it right after the current tab
        });

    } catch (error) {
        console.error('Error handling Toolbox open:', error);
    }
}

// Listen for messages from the web app
chrome.runtime.onMessageExternal.addListener(
    async function(request, sender, sendResponse) {
        if (sender.origin !== SF_TOOLBOX_URL) {
            return;
        }

        if (request.action === 'storeAuth') {
            const { domain, refreshToken } = request.data;
            await chrome.storage.local.set({
                [domain]: { refreshToken, timestamp: Date.now() }
            });
            sendResponse({ success: true });
        }
    }
);