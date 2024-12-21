import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, FileCode, Package, Zap, ChevronRight, ChevronDown } from 'lucide-react'
import { refreshAccessToken } from '@/lib/auth'
import { storage } from '@/lib/storage'
import { FileItem } from '@/types/files'

interface FileSelectionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onFileSelect: (fileId: string, fileType: string) => void
    files: Record<string, FileItem[]>
}

/*interface FileItem {
    Id: string
    Name: string
    Type: string
    Managed: boolean
    LastModifiedDate: string
    Path?: string
    SubComponents?: FileItem[]
}*/

interface FileTreeItemProps {
    item: FileItem
    onSelect: (id: string, type: string) => void
}

function FileTreeItem({ item, onSelect }: FileTreeItemProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    if (!item.SubComponents) {
        return (
            <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer" onClick={() => onSelect(item.Id, item.Type)}>
                <div className="font-medium">{item.Name}</div>
                <div className="text-sm text-gray-500">
                    Last modified: {new Date(item.LastModifiedDate).toLocaleString()}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-1">
            <div
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex items-center"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                <div>
                    <div className="font-medium">{item.Name}</div>
                    <div className="text-sm text-gray-500">
                        Last modified: {new Date(item.LastModifiedDate).toLocaleString()}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="ml-6 space-y-1">
                    {item.SubComponents.map((subItem) => (
                        <div
                            key={subItem.Id}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                            onClick={() => onSelect(subItem.Id, subItem.Type)}
                        >
                            <div className="font-medium">{subItem.Name}</div>
                            {subItem.Path && <div className="text-sm text-gray-500">{subItem.Path}</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export function FileSelectionModal({ open, onOpenChange, onFileSelect, files: providedFiles }: FileSelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [files, setFiles] = useState<Record<string, FileItem[]>>({
        apexClasses: [],
        triggers: [],
        lwc: [],
        aura: [],
    })

    useEffect(() => {
        // First try to use provided files
        if (providedFiles && Object.keys(providedFiles).length > 0) {
            setFiles(providedFiles)
            return
        }

        // Fall back to cached files if no provided files
        const currentDomain = storage.getCurrentDomain() as string
        const cachedFiles = storage.getFromDomain(currentDomain, 'cached_files')
        if (cachedFiles) {
            const parsed = JSON.parse(cachedFiles)
            setFiles({
                apexClasses: parsed.apexClasses || [],
                triggers: parsed.triggers || [],
                lwc: parsed.lwc || [],
                aura: parsed.aura || [],
            })
        }
    }, [open, providedFiles]) // Update when modal opens or files prop changes

    const filterFiles = (items: FileItem[]) => {
        if (!searchQuery) return items
        return items.filter((item) => item.Name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select File</DialogTitle>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <Tabs defaultValue="" className="flex-1">
                    <TabsList>
                        <TabsTrigger value="apexClasses">
                            <FileCode className="w-4 h-4 mr-2" />
                            Apex Classes
                        </TabsTrigger>
                        <TabsTrigger value="triggers">
                            <Zap className="w-4 h-4 mr-2" />
                            Triggers
                        </TabsTrigger>
                        <TabsTrigger value="lwc">
                            <Package className="w-4 h-4 mr-2" />
                            Lightning Web Components
                        </TabsTrigger>
                        <TabsTrigger value="aura">
                            <Package className="w-4 h-4 mr-2" />
                            Aura Components
                        </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 mt-4 h-[400px]">
                        {Object.entries(files).map(([type, items]) => (
                            <TabsContent key={type} value={type} className="m-0">
                                <div className="space-y-2">
                                    {filterFiles(items).map((item) => (
                                        <FileTreeItem
                                            key={item.Id}
                                            item={item}
                                            onSelect={onFileSelect}
                                            //disabled={item.managed = false ? true : false}
                                        />
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
