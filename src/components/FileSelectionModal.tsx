import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileCode, Package, Zap, ChevronRight, ChevronDown } from "lucide-react"
import { refreshAccessToken } from '@/lib/auth'

interface FileSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileSelect: (fileId: string, fileType: string) => void
}

interface FileItem {
  Id: string
  Name: string
  Type: string
  LastModifiedDate: string
  SubComponents?: FileItem[]
}

interface FileTreeItemProps {
  item: FileItem
  onSelect: (id: string, type: string) => void
}

function FileTreeItem({ item, onSelect }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!item.SubComponents) {
    return (
      <div
        className="p-2 hover:bg-gray-100 rounded cursor-pointer"
        onClick={() => onSelect(item.Id, item.Type)}
      >
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
        className="p-2 hover:bg-gray-100 rounded cursor-pointer flex items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 mr-2" />
        ) : (
          <ChevronRight className="w-4 h-4 mr-2" />
        )}
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
              className="p-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => onSelect(subItem.Id, subItem.Type)}
            >
              <div className="font-medium">{subItem.Name}</div>
              {subItem.Path && (
                <div className="text-sm text-gray-500">{subItem.Path}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function FileSelectionModal({ open, onOpenChange, onFileSelect }: FileSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<Record<string, FileItem[]>>({
    apexClasses: [],
    triggers: [],
    lwc: [],
    aura: []
  })

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const refreshToken = localStorage.getItem('sf_refresh_token')
      if (!refreshToken) throw new Error('No refresh token found')

      const { access_token, instance_url } = await refreshAccessToken(refreshToken)

      const response = await fetch(
        `/api/salesforce/files?instance_url=${encodeURIComponent(instance_url)}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to fetch files')
      const data = await response.json()
      setFiles(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchFiles()
    }
  }, [open])

  const filterFiles = (items: FileItem[]) => {
    if (!searchQuery) return items
    return items.filter(item => 
      item.Name.toLowerCase().includes(searchQuery.toLowerCase())
    )
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

        <Tabs defaultValue="apex" className="flex-1">
          <TabsList>
            <TabsTrigger value="apex">
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
            {Object.entries({
              apex: files.apexClasses,
              triggers: files.triggers,
              lwc: files.lwc,
              aura: files.aura
            }).map(([type, items]) => (
              <TabsContent key={type} value={type} className="m-0">
                <div className="space-y-2">
                  {filterFiles(items).map((item) => (
                    <FileTreeItem
                      key={item.Id}
                      item={item}
                      onSelect={onFileSelect}
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