export interface FileItem {
    Id: string
    Name: string
    Type: string
    Managed: boolean
    LastModifiedDate: string
    Path?: string
    SubComponents?: FileItem[]
} 