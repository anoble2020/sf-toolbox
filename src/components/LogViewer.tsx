"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Timeline } from "@/components/Timeline"
import { TraceViewer } from "@/components/TraceViewer"
import { LogReplay } from "@/components/LogReplay"
import { formatLogs } from '@/lib/logFormatter'

interface LogViewerProps {
  content: string
  isLoading?: boolean
}

export function LogViewer({ content, isLoading = false }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLines, setFilteredLines] = useState<string[]>([])
  const [showTimeline, setShowTimeline] = useState(false)
  const [debugOnly, setDebugOnly] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [prettyMode, setPrettyMode] = useState(false)
  
  useEffect(() => {
    if (!content) {
      setFilteredLines([])
      return
    }
    
    let lines = content.split("\n")
    
    if (debugOnly) {
      lines = lines.filter(line => line.includes("USER_DEBUG"))
    }
    
    if (searchQuery) {
      lines = lines.filter(line => 
        line.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (prettyMode) {
      lines = formatLogs(lines)
    }
    
    setFilteredLines(lines)
  }, [content, searchQuery, debugOnly, prettyMode])

  return (
    <div className="h-full flex flex-col">
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
          <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
            id="pretty-mode"
            checked={prettyMode}
            onCheckedChange={setPrettyMode}
            />
            <Label htmlFor="pretty-mode" className="text-sm text-gray-600">
            Pretty
            </Label>
        </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="debug-mode"
                checked={debugOnly}
                onCheckedChange={setDebugOnly}
              />
              <Label htmlFor="debug-mode" className="text-sm text-gray-600">
                Debug Only
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <LineChart className="w-4 h-4 mr-1" />
              {showTimeline ? 'Hide Timeline' : 'Timeline'}
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplay(!showReplay)}
                >
                {showReplay ? 'Hide Replay' : 'Replay'}
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline section */}
      {showTimeline && (
        <div className="flex-none bg-gray-50 border-b border-gray-200">
          {/* <Timeline logContent={content} /> */}
          <TraceViewer content={content} />
        </div>
      )}
        {/* Replay section */}
        {showReplay && (
        <div className="flex-none bg-gray-50 border-b border-gray-200">
            <LogReplay 
            content={content} 
            onLineSelect={setSelectedLine}
            />
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