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
    setCurrentDomain(domain: string) {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        allData.current_domain = domain;
        localStorage.setItem('sf_data', JSON.stringify(allData));
    },

    getCurrentDomain(): string | null {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        return allData.current_domain || null;
    },

    getDomainData(domain: string): DomainData {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        return allData[domain] || {};
    },

    setDomainData(domain: string, data: DomainData) {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        allData[domain] = data;
        localStorage.setItem('sf_data', JSON.stringify(allData));
    },

    setForDomain(domain: string, key: string, value: any) {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}')
        if (!allData[domain]) {
            allData[domain] = {}
        }
        allData[domain][key] = value
        localStorage.setItem('sf_data', JSON.stringify(allData))
    },

    getFromDomain(domain: string, key: string) {
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}')
        return allData[domain]?.[key]
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

    addConnectedOrg(org: ConnectedOrg) {
        const orgs = this.getConnectedOrgs();
        const updatedOrgs = orgs.some(existingOrg => existingOrg.orgId === org.orgId)
            ? orgs.map(existingOrg => existingOrg.orgId === org.orgId ? org : existingOrg)
            : [...orgs, org];
        this.setConnectedOrgs(updatedOrgs);
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
    }
}; 