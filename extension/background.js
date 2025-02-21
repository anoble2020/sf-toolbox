const SF_TOOLBOX_URL = 'https://sf-toolbox.com/auth/session';  // Update with production URL

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openToolbox') {
        handleToolboxOpen(request.domain);
    }
});

async function handleToolboxOpen(domain) {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        const instanceUrl = new URL(currentTab.url).origin;

        // Get the sid cookie using the full URL
        const cookie = await chrome.cookies.get({
            name: 'sid',
            url: instanceUrl,
        });

        if (!cookie) {
            console.error('No session cookie found');
            return;
        }

        // Check if we have an existing refresh token for this domain
        const response = await fetch('https://sf-toolbox.com/api/auth/check-domain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                domain: domain,
                instance_url: instanceUrl
            })
        });

        const data = await response.json();
        let targetUrl;

        if (data.authenticated) {
            // If authenticated, go directly to dashboard
            targetUrl = 'https://sf-toolbox.com/dashboard';
        } else {
            // If not authenticated, go to auth flow with connect=true
            targetUrl = `https://sf-toolbox.com/auth?connect=true&domain=${domain}&environment=${domain.includes('sandbox') ? 'sandbox' : 'production'}`;
        }

        // Open in a new tab
        chrome.tabs.create({
            url: targetUrl,
            active: true,
            index: currentTab.index + 1
        });
    } catch (error) {
        console.error('Error handling Toolbox open:', error);
    }
}