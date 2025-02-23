interface DomainData {
    last_accessed?: Date;
    cached_files?: any;
    cached_test_classes?: any;
    cached_trace_flags?: any;
    saved_code_blocks?: any;
    refresh_token?: string;
    user_info?: any;
    pending_log_selection?: string;
}

interface ConnectedOrg {
    orgId: string;
    orgDomain: string;
    username: string;
    environmentType: string;
    refreshToken: string;
    lastAccessed: string;
}

interface GlobalData {
    theme?: string;
    current_domain?: string;
    connected_orgs?: ConnectedOrg[];
}

export const storage = {
    getAllConnectedOrgs(): ConnectedOrg[] {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}')
        const orgMap = new Map<string, ConnectedOrg>()
        
        // Iterate through all domains (excluding current_domain key)
        Object.keys(allData).forEach(key => {
            if (key !== 'current_domain') {
                const domainData = allData[key]
                if (domainData.connected_orgs?.length) {
                    // For each org in the domain, only keep the most recently accessed version
                    domainData.connected_orgs.forEach((org: ConnectedOrg) => {
                        const existingOrg = orgMap.get(org.orgId)
                        if (!existingOrg || new Date(org.lastAccessed) > new Date(existingOrg.lastAccessed)) {
                            orgMap.set(org.orgId, org)
                        }
                    })
                }
            }
        })
        
        // Convert map back to array and sort by last accessed
        return Array.from(orgMap.values())
            .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    },

    getCurrentDomain(): string | null {
        if (typeof window !== 'undefined') {
            // First try to get domain from URL
            const urlParams = new URLSearchParams(window.location.search)
            const orgFromUrl = urlParams.get('org')
            
            if (orgFromUrl) {
                return orgFromUrl
            }

            // If not in URL but in localStorage, update URL if not on auth page
            const storedDomain = localStorage.getItem('sf_current_domain')
            if (storedDomain && !window.location.pathname.startsWith('/auth')) {
                // Update URL without causing navigation
                const newUrl = new URL(window.location.href)
                newUrl.searchParams.set('org', storedDomain)
                window.history.replaceState({}, '', newUrl.toString())
                return storedDomain
            }
            return storedDomain
        }
        return null
    },

    setCurrentDomain(domain: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('sf_current_domain', domain)
            // Also update URL if not on auth page
            if (!window.location.pathname.startsWith('/auth')) {
                const newUrl = new URL(window.location.href)
                newUrl.searchParams.set('org', domain)
                window.history.replaceState({}, '', newUrl.toString())
            }
        }
    },

    addConnectedOrg(org: ConnectedOrg) {
        console.log('Adding connected org:', org)
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}')
        
        // Initialize domain data if it doesn't exist
        if (!allData[org.orgDomain]) {
            allData[org.orgDomain] = {}
        }
        
        // Get existing orgs for this domain
        const domainOrgs = allData[org.orgDomain].connected_orgs || []
        
        // Update or add the org
        const updatedOrgs = domainOrgs.some((existing: any) => existing.orgId === org.orgId)
            ? domainOrgs.map((existing: any) => 
                existing.orgId === org.orgId ? { ...org, lastAccessed: new Date().toISOString() } : existing
              )
            : [...domainOrgs, { ...org, lastAccessed: new Date().toISOString() }]
        
        // Update the domain's data
        allData[org.orgDomain] = {
            ...allData[org.orgDomain],
            connected_orgs: updatedOrgs,
            refresh_token: org.refreshToken, // Ensure refresh token is stored at domain level
            last_accessed: new Date().toISOString()
        }
        
        localStorage.setItem('sf_data', JSON.stringify(allData))
        console.log('Updated storage:', allData)
        return updatedOrgs
    },

    setForDomain(domain: string, key: string, value: any) {
        console.log(`Setting ${key} for domain:`, domain, value)
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}')
        if (!allData[domain]) {
            allData[domain] = {}
        }
        allData[domain][key] = value
        localStorage.setItem('sf_data', JSON.stringify(allData))
    },

    getFromDomain(domain: string, key: string) {
        console.log(`Getting ${key} from domain:`, domain)
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}')
        const value = allData[domain]?.[key]
        console.log(`Value for ${key}:`, value)
        return value
    },

    setGlobal(key: 'theme', value: string) {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        allData[key] = value;
        localStorage.setItem('sf_data', JSON.stringify(allData));
    },

    getGlobal(key: 'theme'): string | undefined {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        return allData[key];
    },

    clearDomain(domain: string) {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        delete allData[domain];
        localStorage.setItem('sf_data', JSON.stringify(allData));
    },

    getConnectedOrgs(): ConnectedOrg[] {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        return allData.connected_orgs || [];
    },

    setConnectedOrgs(orgs: ConnectedOrg[]) {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        allData.connected_orgs = orgs;
        localStorage.setItem('sf_data', JSON.stringify(allData));
    },

    setObjectForDomain(domain: string, key: string, value: object) {
        const storageKey = `${domain}:${key}`
        const existingData = localStorage.getItem(domain) || '{}'
        const domainData = JSON.parse(existingData)
        
        domainData[key] = value // Store as object directly
        
        localStorage.setItem(domain, JSON.stringify(domainData))
    },

    getObjectFromDomain(domain: string, key: string) {
        const existingData = localStorage.getItem(domain) || '{}'
        const domainData = JSON.parse(existingData)
        return domainData[key] // Return object directly
    },

    getAllDomains(): string[] {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}')
        return Object.keys(allData).filter(key => key !== 'current_domain')
    },

    updateConnectedOrgs(newOrg: ConnectedOrg) {
        const currentDomain = this.getCurrentDomain()
        if (!currentDomain) return

        const connectedOrgs = this.getAllConnectedOrgs()
        const updatedOrgs = connectedOrgs.some(org => org.orgId === newOrg.orgId)
            ? connectedOrgs.map(org => org.orgId === newOrg.orgId ? newOrg : org)
            : [...connectedOrgs, newOrg]

        this.setForDomain(currentDomain, 'connected_orgs', updatedOrgs)
    }
}; 