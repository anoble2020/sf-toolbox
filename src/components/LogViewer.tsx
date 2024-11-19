"use client"

import { useState, useEffect, useRef } from "react"
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
  type: 'SOQL' | 'JSON' | 'STANDARD' | 'LIMITS' | 'CODE_UNIT';
  isCollapsible?: boolean;
  nestLevel?: number;
  isSelected?: boolean;
}

const renderSqlWithBoldKeywords = (text: string) => {
  // Split by ** markers that were added by boldSqlKeywords
  const parts = text.split('**');
  return parts.map((part, index) => {
    // Even indices are regular text, odd indices are keywords
    return index % 2 === 0 ? (
      <span key={index}>{part}</span>
    ) : (
      <span key={index} className="font-bold">{part}</span>
    );
  });
};

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
  const [selectedLineContent, setSelectedLineContent] = useState<{
    pretty: string | null;
    raw: string | null;
  }>({ pretty: null, raw: null });
  const selectedLineRef = useRef<HTMLDivElement>(null);
  const [originalLineIndices, setOriginalLineIndices] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (selectedLineContent && selectedLineRef.current) {
      selectedLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedLineContent, filteredLines]);

  // When content changes, create a mapping of line content to original indices
  useEffect(() => {
    if (!content) return;
    const newMap = new Map();
    content.split("\n").forEach((line, index) => {
      newMap.set(line, index);
    });
    setOriginalLineIndices(newMap);
  }, [content]);

  useEffect(() => {
    if (!content) {
      setFilteredLines([]);
      return;
    }

    const allLines = content.split("\n");
    
    // Create a mapping of line content to original indices
    const lineToIndexMap = new Map<string, number>();
    allLines.forEach((line, index) => {
      lineToIndexMap.set(line, index);
    });

    let processedLines = allLines.map((line, index) => ({
      line,
      originalIndex: index
    }));

    if (debugOnly) {
      processedLines = processedLines.filter(({ line }) => line.includes("USER_DEBUG"));
    }

    if (searchQuery) {
      processedLines = processedLines.filter(({ line }) => 
        line.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (prettyMode) {
      // Pass the original lines array to formatLogs, not just the filtered lines
      const formattedLines = formatLogs(allLines);
      // Then filter the formatted lines based on our criteria
      let filteredFormatted = formattedLines;
      if (debugOnly) {
        filteredFormatted = formattedLines.filter(line => line.summary.includes("Debug"));
      }
      if (searchQuery) {
        filteredFormatted = filteredFormatted.filter(line => 
          line.summary.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setFilteredLines(filteredFormatted.map(line => ({
        ...line,
        isSelected: selectedLineContent?.id === `line_${line.originalIndex}`
      })));
    } else {
      setFilteredLines(processedLines.map(({ line, originalIndex }) => ({
        id: `line_${originalIndex}`,
        time: '',
        summary: line,
        type: 'STANDARD',
        isCollapsible: false,
        originalIndex,
        isSelected: selectedLineContent?.id === `line_${originalIndex}`
      })));
    }
  }, [content, searchQuery, debugOnly, prettyMode, selectedLineContent]);

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

  const handleLineClick = (line: CollapsibleLine, isExpandToggle: boolean = false) => {
    if (isExpandToggle) {
      toggleLine(line.id);
      return;
    }

    // Debug logging
    console.log('Clicked line details:', {
      id: line.id,
      originalIndex: line.originalIndex,
      currentSelectedId: selectedLineContent?.id
    });

    // Handle deselection
    if (selectedLineContent?.id === `line_${line.originalIndex}`) {
      setSelectedLineContent({ id: '', raw: null, pretty: null });
      return;
    }

    // Get raw line using the original index
    const rawLine = content?.split('\n')[line.originalIndex];

    const newSelectedContent = {
      id: `line_${line.originalIndex}`,
      raw: rawLine || null,
      pretty: prettyMode ? `${line.time}|${line.summary}` : null
    };

    console.log('Setting selected line content:', newSelectedContent);
    setSelectedLineContent(newSelectedContent);
  };

  const renderSqlWithBoldKeywords = (text: string) => {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'LIMIT', 
      'ORDER BY', 'GROUP BY', 'IN', 'LIKE', 'TYPEOF', 
      'OFFSET', 'HAVING', 'INCLUDES', 'EXCLUDES', 'NOT'
    ];
    
    let result = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      result = result.replace(regex, `**${keyword}**`);
    });
    
    const parts = result.split('**');
    return parts.map((part, index) => {
      return index % 2 === 0 ? (
        <span key={index}>{part}</span>
      ) : (
        <span key={index} className="font-bold">{part}</span>
      );
    });
  };

  const renderLine = (line: CollapsibleLine) => {
    const isSelected = selectedLineContent?.id === `line_${line.originalIndex}`;
    
    const baseClasses = `
      py-1
      ${line.type === 'LIMITS' ? 'bg-[#DADADA] hover:bg-[#C0C0C0]' : ''}
      ${isSelected ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'}
      ${line.type !== 'LIMITS' ? 'cursor-pointer' : ''}
    `;

    if (!prettyMode || !line.isCollapsible) {
      return (
        <div 
          className={baseClasses}
          onClick={() => line.type !== 'LIMITS' && handleLineClick(line)}
          ref={isSelected ? selectedLineRef : null}
        >
          <div className="px-2">
            {line.type === 'SOQL' ? (
              renderSqlWithBoldKeywords(line.summary)
            ) : (
              line.summary
            )}
          </div>
        </div>
      );
    }

    const isExpanded = expandedLines.has(line.id);
    
    return (
      <div 
        className={baseClasses}
        onClick={() => line.type !== 'LIMITS' && handleLineClick(line)}
        ref={isSelected ? selectedLineRef : null}
      >
        <div className="flex items-center gap-2 px-2">
          {line.isCollapsible && (
            <span 
              className="text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                handleLineClick(line, true);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {line.type === 'SOQL' ? (
            renderSqlWithBoldKeywords(line.summary)
          ) : (
            line.summary
          )}
        </div>
        {isExpanded && line.details && (
          <div className="pl-8 py-2 bg-gray-50 font-mono text-sm w-full whitespace-pre">
            {line.details}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col ml-1">
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