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

export interface LogTab {
    id: string
    content: string
    time: string
    duration: string
}

export interface LogViewerProps {
    logs: LogTab[]
    isLoading?: boolean
    onCloseLog?: (logId: string) => void
}

export interface TabState {
    prettyMode: boolean
    debugOnly: boolean
    searchQuery: string
    showTimeline: boolean
    showReplay: boolean
    selectedLine: number | null
    expandedLines: Set<string>
    selectedLineContent: {
        id: string
        pretty: string | null
        raw: string | null
    }
}
