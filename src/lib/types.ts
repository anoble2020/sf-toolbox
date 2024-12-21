export interface SavedCodeBlock {
    id: string
    name: string
    code: string
    lastModified: string
}

export interface ConnectedOrg {
    orgId: string
    orgDomain: string
    environmentType: 'sandbox' | 'production'
    username: string
    refreshToken: string
    lastAccessed: string
}
