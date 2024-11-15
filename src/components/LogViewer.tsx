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

interface CollapsibleLine {
  id: string;
  time: string;
  summary: string;
  details?: string;
  type: 'SOQL' | 'JSON' | 'STANDARD' | 'LIMITS';
  isCollapsible?: boolean;
}

export function LogViewer({ content, isLoading = false }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLines, setFilteredLines] = useState<CollapsibleLine[]>([])
  const [showTimeline, setShowTimeline] = useState(false)
  const [debugOnly, setDebugOnly] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [prettyMode, setPrettyMode] = useState(false)
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());

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
      console.log('Formatting lines in pretty mode');
      const formattedLines = formatLogs(lines);
      console.log('Formatted lines:', formattedLines);
      setFilteredLines(formattedLines);
    } else {
      setFilteredLines(lines.map((line, index) => ({
        id: `line_${index}`,
        time: '',
        summary: line,
        type: 'STANDARD',
        isCollapsible: false
      })))
    }
  }, [content, searchQuery, debugOnly, prettyMode])

  const toggleLine = (lineId: string) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const renderLine = (line: CollapsibleLine) => {
    console.log('Rendering line:', line);
    
    if (!prettyMode || !line.isCollapsible) {
      return <div className={`py-1 pl-2 ${line.type === 'LIMITS' ? 'bg-[#E6E3FE]' : ''}`}>
      {line.summary}
    </div>;
    }

    const isExpanded = expandedLines.has(line.id);
    
    return (
      <div 
        className="cursor-pointer hover:bg-gray-50 py-1"
        onClick={() => toggleLine(line.id)}
      >
        <div className="pl-2 flex items-center gap-2">
          <span className="text-gray-500">
            {isExpanded ? '▼' : '▶'}
          </span>
          {line.summary}
        </div>
        {isExpanded && line.details && (
          <div className="pl-8 py-2 bg-gray-50 font-mono text-sm">
            {line.details}
          </div>
        )}
      </div>
    );
  };

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
      <div className="flex-1 overflow-auto font-mono text-sm">
        {filteredLines.map((line, index) => (
          <div key={index}>
            {renderLine(line)}
          </div>
        ))}
      </div>
    </div>
  )
} 