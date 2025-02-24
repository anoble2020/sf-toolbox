"use client"

import { useEffect, useState, useCallback } from "react"
import { LogsTable } from "@/components/LogsTable"
import { LogViewer } from "@/components/LogViewer"
import { queryLogs, getLogBody } from "@/lib/salesforce"
import { Loader2, MousePointerClick } from "lucide-react"
import { storage } from "@/lib/storage"
import { toast } from "sonner"
import { TabState } from "@/lib/types"

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

interface LogTab {
  id: string
  content: string
  time: string
  duration: string
}

/*interface TabState {
  prettyMode: boolean
  debugOnly: boolean
  searchQuery: string
  showTimeline: boolean
  showReplay: boolean
  selectedLine: number | null
  expandedLines: Set<number>
  selectedLineContent: {
    id: string
    pretty: string | null
    raw: string | null
  }
}*/

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [selectedLogs, setSelectedLogs] = useState<LogTab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [currentUserOnly, setCurrentUserOnly] = useState(true)
  const [isLoadingLog, setIsLoadingLog] = useState(false)
  const [tabStates, setTabStates] = useState<Record<string, TabState>>({})
  const [activeTab, setActiveTab] = useState('')

  const formatDuration = (ms?: number): string => {
    if (!ms) return 'N/A'
    
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

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching logs...')
      const apexLogs = await queryLogs()
      console.log('Received logs:', apexLogs)
      
      if (!Array.isArray(apexLogs)) {
        console.error('Invalid logs data:', apexLogs)
        throw new Error('Received invalid logs data')
      }

      if (apexLogs.length === 0) {
        console.log('No logs returned from API')
      }

      const formattedLogs = apexLogs
        .filter(log => log && log.Id)
        .map(log => {
          try {
            return {
              id: log.Id,
              user: log.LogUser?.Name || 'Unknown',
              userId: log.LogUser?.Id || '',
              operation: log.Operation || '',
              time: log.LastModifiedDate || '',
              duration: formatDuration(log.DurationMilliseconds),
              status: log.Status || '',
              size: `${((log.LogLength || 0) / 1024).toFixed(0)}KB`,
              durationMilliseconds: log.DurationMilliseconds
            }
          } catch (err) {
            console.error('Error formatting log:', log, err)
            return null
          }
        })
        .filter(Boolean) as Log[]

      console.log('Final formatted logs:', formattedLogs)
      setLogs(formattedLogs)

      // Check for pending log selection after logs are loaded
      const pendingLogId = localStorage.getItem('pending_log_selection')
      if (pendingLogId) {
        const logToSelect = formattedLogs.find(log => log?.id === pendingLogId)
        if (logToSelect) {
          console.log('Found pending log to select:', logToSelect)
          handleSelectLog(logToSelect)
        } else {
          console.log('Pending log not found in fetched logs:', pendingLogId)
        }
        localStorage.removeItem('pending_log_selection')
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch logs'
      console.error('Failed to fetch logs:', {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLog = async (log: Log) => {
    // If the log is already open, just make it active
    if (tabStates[log.id]) {
      setActiveTab(log.id)
      return
    }

    // Otherwise, proceed with loading the log and initializing its state
    try {
      setIsLoadingLog(true)
      const logContent = await getLogBody(log.id)
      setSelectedLogs(prev => [...prev, { ...log, content: logContent }])
      setTabStates(prev => ({
        ...prev,
        [log.id]: {
          prettyMode: false,
          debugOnly: false,
          searchQuery: '',
          showTimeline: false,
          showReplay: false,
          selectedLine: null,
          expandedLines: new Set(),
          selectedLineContent: {
            id: '',
            pretty: null,
            raw: null
          }
        }
      }))
      setActiveTab(log.id)
    } catch (error) {
      console.error('Error fetching log content:', error)
    } finally {
      setIsLoadingLog(false)
    }
  }

  const handleCloseLog = (logId: string) => {
    setSelectedLogs(prev => prev.filter(log => log.id !== logId))
  }

  useEffect(() => {
    const currentDomain = storage.getCurrentDomain() as string
    const storedUserInfo = storage.getFromDomain(currentDomain, 'user_info')
    // Set user info after component mounts
    setUserInfo(storedUserInfo)
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [])

  if (loading) {
    return (
      <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-500">Error: {error}</div>
        <button 
          onClick={fetchLogs}
          className="mt-4 px-4 py-2 bg-blue-500 dark:bg-background text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  console.log('User info:', userInfo);
  console.log('currentUserOnly:', currentUserOnly);

  console.log('Filtering logs with:', {
    currentUserOnly,
    userInfo,
    'userInfo.user_id': userInfo?.user_id,
    'total logs': logs.length,
    'sample log userId': logs[0]?.userId,
    'all log userIds': logs.map(log => ({ id: log.id, userId: log.userId }))
  });

  const filteredLogs = currentUserOnly && userInfo?.user_id
    ? logs.filter(log => {
        console.log('Comparing log:', {
          logUserId: log.userId,
          userInfoId: userInfo.user_id,
          matches: log.userId === userInfo.user_id
        });
        return log.userId === userInfo.user_id;
      })
    : logs;

  console.log('Filtered logs count:', filteredLogs.length);

  return (
    <div className="relative h-full">
      <LogViewer 
        logs={selectedLogs}
        isLoading={isLoadingLog}
        onCloseLog={handleCloseLog}
        tabStates={tabStates}
        setTabStates={setTabStates}
        activeLogId={activeTab}
      />
      <LogsTable 
        logs={filteredLogs}
        isLoadingLog={isLoadingLog} 
        onSelectLog={handleSelectLog}
        onRefresh={fetchLogs}
        currentUserOnly={currentUserOnly}
        onToggleCurrentUser={setCurrentUserOnly}
      />
    </div>
  )
} 