const SF_TOOLBOX_URL = 'http://localhost:3000/auth/session';  // Replace with your app's URL

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
            url: instanceUrl,  // Changed from domain to url
        });

        console.log('cookie', cookie);

        if (!cookie) {
            console.error('No session cookie found');
            return;
        }

        // Construct the URL with parameters
        const toolboxUrl = new URL(SF_TOOLBOX_URL);
        toolboxUrl.searchParams.set('session_token', cookie.value);
        toolboxUrl.searchParams.set('instance_url', instanceUrl);
        toolboxUrl.searchParams.set('domain', domain);

        // Open in a new tab
        chrome.tabs.create({
            url: toolboxUrl.toString(),
            active: true,
            index: currentTab.index + 1
        });
    } catch (error) {
        console.error('Error handling Toolbox open:', error);
    }
}