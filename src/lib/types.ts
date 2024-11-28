export interface SavedCodeBlock {
    id: string
    name: string
    code: string
    lastModified: string
    orgId: string
}

export interface ConnectedOrg {
    orgId: string
    orgDomain: string
    username: string
    refreshToken: string
    lastAccessed: string
}
