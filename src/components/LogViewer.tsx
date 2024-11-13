"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Timeline } from "@/components/Timeline"
interface LogViewerProps {
  content: string
  isLoading?: boolean
}

export function LogViewer({ content, isLoading = false }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLines, setFilteredLines] = useState<string[]>([])
  const [showTimeline, setShowTimeline] = useState(false)
  
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLines(content.split("\n"))
      return
    }
    
    const lines = content.split("\n").filter(line => 
      line.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredLines(lines)
  }, [content, searchQuery])

  const toggleTimeline = () => {
    setShowTimeline(!showTimeline)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter bar */}
      <div className="flex-none bg-white border-b border-gray-200 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Filter log lines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <span className="text-sm text-gray-500">
              Showing {filteredLines.length} lines
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTimeline}
          >
            <LineChart className="w-4 h-4 mr-1" />
            {showTimeline ? 'Hide Timeline' : 'Analyze Timeline'}
          </Button>
        </div>
      </div>

      {/* Timeline section */}
      {showTimeline && (
        <div className="flex-none bg-gray-50 border-b border-gray-200">
          <Timeline logContent={content} />
        </div>
      )}

      {/* Log content */}
      <div className="flex-1 overflow-auto min-h-0">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
          {filteredLines.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </pre>
      </div>
    </div>
  )
} 