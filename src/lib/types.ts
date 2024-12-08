export interface SavedCodeBlock {
    id: string
    name: string
    code: string
    lastModified: string
}

export interface ConnectedOrg {
    orgId: string
    orgDomain: string
    environmentType: string
    username: string
    refreshToken: string
    lastAccessed: string
}
