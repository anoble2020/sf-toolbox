// Helper function to check if the setup menu exists and our item doesn't
function shouldAddMenuItem() {
    return (
        document.querySelector('#developer-console-link') && 
        !document.querySelector('#sf-toolbox-link')
    );
}

// Helper function for logging
function debugLog(message, ...args) {
    console.log(`[SF Toolbox Extension] ${message}`, ...args);
}

/*function addToolboxMenuItem() {
    debugLog('Attempting to add toolbox menu item...');

    // Look for the Developer Console item with exact classes
    const devConsoleItem = document.querySelector('li#developer-console-link.slds-dropdown__item.uiMenuItem.onesetupSetupMenuItem');
    debugLog('Developer Console item found:', devConsoleItem);
    
    if (!devConsoleItem) {
        debugLog('Developer Console item not found, aborting');
        return;
    }

    if (document.querySelector('#sf-toolbox-link')) {
        debugLog('Toolbox menu item already exists, aborting');
        return;
    }

    debugLog('Creating new menu item...');

    // Create new menu item with matching classes
    const toolboxItem = document.createElement('li');
    toolboxItem.id = 'sf-toolbox-link';
    toolboxItem.role = 'presentation';
    toolboxItem.className = 'slds-dropdown__item uiMenuItem onesetupSetupMenuItem';
    
    toolboxItem.innerHTML = `
    <a role="menuitem" data-id="sf-toolbox-link" title="SF Toolbox" style="display: block; text-decoration: none;">
        <div class="slds-grid" style="padding: 0.5rem 0.75rem;">
            <div class="slds-col slds-size_10-of-12">
                <span class="slds-truncate">
                    <span class="slds-align-middle">SF Toolbox</span>
                </span>
            </div>
            <div class="slds-p-right_small slds-p-left_small slds-no-flex slds-size_2-of-12">
                <lightning-icon class="slds-icon-utility-new-window focus-icon new-tab slds-icon_container">
                    <span>
                        <svg focusable="false" aria-hidden="true" viewBox="0 0 520 520" class="slds-icon slds-icon_x-small">
                            <path d="M487 20H296c-8 0-16 5-16 13v30c0 8 7 17 16 17h79c9 0 14 10 7 16L212 266c-6 6-6 15 0 21l21 21c6 6 15 6 21 0l170-170c6-6 16-2 16 7v79c0 8 8 17 16 17h29c8 0 15-9 15-17V34c0-9-5-14-13-14zM363 255l-34 35c-6 6-9 13-9 21v114c0 8-7 15-15 15H95c-8 0-15-7-15-15V215c0-8 7-15 15-15h115c8 0 16-3 21-9l34-34c6-6 2-17-7-17H60a40 40 0 00-40 40v280a40 40 0 0040 40h280a40 40 0 0040-40V262c0-9-11-13-17-7z"/>
                        </svg>
                    </span>
                </lightning-icon>
            </div>
        </div>
    </a>
`;

// Add hover styles
const style = document.createElement('style');
style.textContent = `
    #sf-toolbox-link a:hover {
        background-color: rgb(243, 242, 242);
        text-decoration: none;
    }
    #sf-toolbox-link:hover + #developer-console-link a {
        background-color: transparent !important;
        border: none !important;
    }
    #sf-toolbox-link a:focus {
        outline: none;
        box-shadow: 0 0 3px #0070d2;
        background-color: rgb(243, 242, 242);
    }
`;
document.head.appendChild(style);

    // Add click handler
    toolboxItem.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        debugLog('Toolbox item clicked');
        chrome.runtime.sendMessage({
            action: 'openToolbox',
            domain: window.location.hostname
        });
    });

    // Insert after Developer Console
    devConsoleItem.parentNode.insertBefore(toolboxItem, devConsoleItem.nextSibling);
    debugLog('Toolbox menu item added successfully');
}

// Watch for the Setup menu to appear
function watchForSetupMenu() {
    debugLog('Starting to watch for Setup menu...');

    const observer = new MutationObserver(() => {
        // Look specifically for the Developer Console item
        const devConsoleItem = document.querySelector('li#developer-console-link.slds-dropdown__item.uiMenuItem.onesetupSetupMenuItem');
        if (devConsoleItem) {
            debugLog('Developer Console item found in mutation');
            addToolboxMenuItem();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Cleanup after 60 seconds
    setTimeout(() => {
        debugLog('Cleaning up observer');
        observer.disconnect();
    }, 60000);
}

// Initialize when the page loads
debugLog('Content script loaded');

if (document.readyState === 'loading') {
    debugLog('Document still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', watchForSetupMenu);
} else {
    debugLog('Document already loaded, starting immediately');
    watchForSetupMenu();
}*/

function addToolboxIcon() {
    debugLog('Attempting to add toolbox icon...');

    // Look for the global actions list
    const actionsList = document.querySelector('ul.slds-global-actions');
    if (!actionsList || document.querySelector('#sf-toolbox-trigger')) {
        return;
    }

    // Create our list item with matching structure
    const toolboxLi = document.createElement('li');
    toolboxLi.className = 'slds-global-actions__item';
    toolboxLi.id = 'sf-toolbox-trigger';
    
    toolboxLi.innerHTML = `
        <a 
            role="button" 
            aria-disabled="false" 
            tabindex="0"
            title="SF Toolbox"
            class="slds-button slds-button_icon slds-button_icon slds-button_icon-container slds-button_icon-small slds-global-actions__item-action"
        >
            <div class="headerTrigger tooltip-trigger uiTooltip">
                <lightning-icon class="slds-button__icon slds-global-header__icon">
                    <span style="--sds-c-icon-color-background: transparent">
                        <lightning-primitive-icon>
                            <img src="${chrome.runtime.getURL('icon_128.png')}" 
                                    alt="SF Toolbox"
                                    style="width: 20px; height: 20px; filter: grayscale(100%) brightness(0.4);">
                        </lightning-primitive-icon>
                    </span>
                </lightning-icon>
                <span role="tooltip" class="tooltip-invisible">SF Toolbox</span>
            </div>
        </a>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #sf-toolbox-trigger {
            margin-left: 4px;
            margin-right: 4px;
        }
        #sf-toolbox-trigger a:hover img {
            filter: grayscale(100%) brightness(0.1) !important;
        }
        #sf-toolbox-trigger .headerTrigger {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);

    // Add click handler
    toolboxLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({
            action: 'openToolbox',
            domain: window.location.hostname
        });
        debugLog('Toolbox icon clicked');
    });

    const setupGear = document.querySelector('.setupGear').closest('li');
    setupGear.parentNode.insertBefore(toolboxLi, setupGear.nextSibling);
    debugLog('Toolbox icon added successfully');
}

function watchForHeader() {
    debugLog('Starting to watch for header...');

    const observer = new MutationObserver(() => {
        const setupGear = document.querySelector('.setupGear');
        if (setupGear && !document.querySelector('#sf-toolbox-trigger')) {
            addToolboxIcon();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setTimeout(() => {
        debugLog('Cleaning up observer');
        observer.disconnect();
    }, 60000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForHeader);
} else {
    watchForHeader();
}