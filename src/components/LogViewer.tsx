"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface LogViewerProps {
  content: string
}

export function LogViewer({ content }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLines, setFilteredLines] = useState<string[]>([])
  
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

  return (
    <div className="flex flex-col h-full">
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 flex items-center gap-2 p-2 border-b bg-white shadow-sm">
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

      {/* Scrollable log content */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-sm font-mono">
          {filteredLines.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </pre>
      </div>
    </div>
  )
} 