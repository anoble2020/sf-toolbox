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

interface Log {
  id: string
  user: string
  operation: string
  time: string
  duration: string
  status: string
  size: string
  content: string
}

interface SortConfig {
  key: keyof Log
  direction: "asc" | "desc"
}

export function LogsTable({ 
  logs,
  onSelectLog 
}: { 
  logs: Log[]
  onSelectLog: (log: Log) => void 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'time', direction: 'desc' });
  const logsPerPage = 10;
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
  
  return (
    <div 
      className={cn(
        "fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 transition-all duration-300",
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

      {/* Collapse toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -top-8 right-4 bg-white border border-gray-200 rounded-t-lg px-4 py-1 text-sm"
      >
        {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Table content */}
      <div className={cn(
        "h-full flex flex-col",
        isCollapsed ? "hidden" : "block"
      )}>
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <TableHeader>
              <TableRow>
                {["User", "Operation", "Time", "Duration", "Status", "Size"].map((header) => (
                  <TableHead 
                    key={header}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort(header.toLowerCase() as keyof Log)}
                  >
                    {header}
                    {sortConfig.key === header.toLowerCase() && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow 
                  key={log.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => onSelectLog(log)}
                >
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.operation}</TableCell>
                  <TableCell>{log.time}</TableCell>
                  <TableCell>{log.duration}</TableCell>
                  <TableCell>{log.status}</TableCell>
                  <TableCell>{log.size}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-2 border-t">
          <div className="text-xs text-gray-500">
            Page {currentPage} of {Math.ceil(logs.length / logsPerPage)}
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