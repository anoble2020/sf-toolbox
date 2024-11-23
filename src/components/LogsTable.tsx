"use client";

import { useState, useRef, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { RefreshCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Log {
  id: string
  user: string
  userId: string
  operation: string
  time: string
  duration: string
  status: string
  size: string
  content?: string
  durationMilliseconds?: number
}

interface SortConfig {
  key: keyof Log
  direction: "asc" | "desc"
}

// Create a type for the header configuration
type HeaderConfig = {
  key: keyof Log
  label: string
}

interface LogsTableProps {
  logs: Log[]
  onSelectLog: (log: Log) => void
  onRefresh: () => void
  currentUserOnly: boolean
  onToggleCurrentUser: (checked: boolean) => void
}

export function LogsTable({ 
  logs,
  onSelectLog,
  onRefresh,
  currentUserOnly,
  onToggleCurrentUser
}: LogsTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'time', direction: 'desc' });
  const logsPerPage = 5;
  const [tableHeight, setTableHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;
      const newHeight = windowHeight - mouseY;
      
      // Set minimum and maximum heights
      const height = Math.min(Math.max(newHeight, 200), windowHeight - 100);
      setTableHeight(height);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleSort = (key: keyof Log) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Sort logs
  const sortedLogs = [...logs].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1
  })

  // Get current page logs
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  )
  
  // Add a helper function to format duration
  const formatDuration = (ms?: number): string => {
    console.log(`Formatting duration: ${ms}`)
    if (!ms) return '-'
    
    if (ms < 1000) {
      return `${ms}ms`
    }
    
    const seconds = Math.floor(ms / 1000)
    const remainingMs = ms % 1000
    
    if (seconds < 60) {
      return `${seconds}.${remainingMs.toString().padStart(3, '0')}s`
    }
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes}m ${remainingSeconds}s`
  }

  // Add a helper function to format datetime
  const formatDateTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date)
    } catch (e) {
      return dateStr
    }
  }

  // Define headers with their sort keys
  const headers: HeaderConfig[] = [
    { key: 'user', label: 'User' },
    { key: 'operation', label: 'Operation' },
    { key: 'time', label: 'Time' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status' },
    { key: 'size', label: 'Size' }
  ]

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 transition-all duration-300 z-40",
        isCollapsed ? "h-12" : ""
      )}
      style={{ height: isCollapsed ? '48px' : `${tableHeight}px` }}
    >
      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize hover:bg-gray-200"
        onMouseDown={() => setIsResizing(true)}
      />

      {/* Table controls */}
      <div className="absolute -top-8 right-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="rounded-t-lg rounded-b-none"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-white border border-gray-200 rounded-t-lg px-4 py-1 text-sm"
        >
          {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Table content */}
      <div className={cn(
        "h-full flex flex-col",
        isCollapsed ? "hidden" : "block"
      )}>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[11px]">
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead 
                    key={`header-${header.key}`}
                    className="cursor-pointer hover:bg-gray-50 text-[11px] whitespace-nowrap"
                    onClick={() => handleSort(header.key)}
                  >
                    {header.label}
                    {sortConfig.key === header.key && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs
                .filter(log => log && log.id)
                .map((log) => (
                  <TableRow 
                    key={log.id}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => onSelectLog(log)}
                  >
                    <TableCell className="whitespace-nowrap">{log.user}</TableCell>
                    <TableCell className="whitespace-nowrap">{log.operation}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(log.time)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDuration(log.durationMilliseconds)}</TableCell>
                    <TableCell className="whitespace-nowrap">{log.status}</TableCell>
                    <TableCell className="whitespace-nowrap">{log.size}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-2 border-t">
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              Page {currentPage} of {Math.ceil(logs.length / logsPerPage)}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="current-user-logs"
                checked={currentUserOnly}
                onCheckedChange={onToggleCurrentUser}
              />
              <Label htmlFor="current-user-logs" className="text-xs text-gray-600">
                My Logs Only
              </Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(logs.length / logsPerPage), p + 1))}
              disabled={currentPage === Math.ceil(logs.length / logsPerPage)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 