'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, LineChart, Bug, Code, Workflow, Database, MousePointerClick, Scale, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TraceViewer } from '@/components/TraceViewer'
import { LogReplay } from '@/components/LogReplay'
import { formatLogs } from '@/lib/logFormatter'
import { LogViewerProps, TabState } from '@/lib/types'
import { X } from 'lucide-react'
import { formatLogTime } from '@/lib/utils'

interface CollapsibleLine {
    id: string
    time: string
    summary: string
    details?: string
    type: 'SOQL' | 'JSON' | 'STANDARD' | 'LIMITS' | 'CODE_UNIT' | 'FLOW' | 'DEBUG' | 'DML' | 'VALIDATION'
    isCollapsible?: boolean
    nestLevel?: number
    isSelected?: boolean
    originalIndex?: number
}

const renderSqlWithBoldKeywords = (text: string) => {
    // Split on markdown-style bold markers
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // Remove the markers and render bold
            return (
                <span key={index} className="font-bold">
                    {part.slice(2, -2)}
                </span>
            )
        }
        return <span key={index}>{part}</span>
    })
}

const IconContainer = ({ children, color }: { children: React.ReactNode; color: string }) => (
    <div 
        className="flex items-center justify-center w-8 h-8 rounded-full shrink-0" 
        style={{ backgroundColor: color }}
    >
        <div className="w-4 h-4 flex items-center justify-center">
            {children}
        </div>
    </div>
)

// Helper function to ensure consistent timestamp formatting
const formatTimestamp = (timestamp: string) => {
    // Remove any extra spaces and ensure consistent format
    return timestamp.trim()
}

const renderSoqlLine = (content: string) => {
    const [timestamp, ...rest] = content.split(/\s*\|\s*/)
    const mainContent = rest.join(' | ')
    const statsMatch = mainContent.match(/\| (Aggregations: \d+ \| Rows: \d+)$/)
    const stats = statsMatch ? statsMatch[1] : ''
    const query = statsMatch ? mainContent.replace(statsMatch[0], '') : mainContent

    return (
        <div className="flex items-center gap-3 w-full">
            <span className="text-gray-600 min-w-[60px]">{formatTimestamp(timestamp)}</span>
            <IconContainer color="#484b6a">
                <Search className="text-white" />
            </IconContainer>
            <span className="flex-1">{renderSqlWithBoldKeywords(query)}</span>
            {stats && <span className="text-gray-600 whitespace-nowrap">{stats}</span>}
        </div>
    )
}

const renderFlowLine = (content: string) => {
    const [timestamp, ...rest] = content.split(/\s*\|\s*/)
    return (
        <div className="flex items-center gap-3">
            <span className="text-gray-600 min-w-[60px]">{formatTimestamp(timestamp)}</span>
            <IconContainer color="#3a49ee">
                <Workflow className="text-white" />
            </IconContainer>
            <span>{rest.join(' | ')}</span>
        </div>
    )
}

const renderCodeUnitLine = (content: string) => {
    const [timestamp, ...rest] = content.split(/\s*\|\s*/)
    return (
        <div className="flex items-center gap-3">
            <span className="text-gray-600 min-w-[60px]">{formatTimestamp(timestamp)}</span>
            <IconContainer color="#94e591">
                <Code className="text-white" />
            </IconContainer>
            <span>{rest.join(' | ')}</span>
        </div>
    )
}

const renderDebugLine = (content: string) => {
    const [timestamp, ...rest] = content.split(/\s*\|\s*/)
    return (
        <div className="flex items-center gap-3">
            <span className="text-gray-600 min-w-[60px]">{formatTimestamp(timestamp)}</span>
            <IconContainer color="#f1ad48">
                <Bug className="text-white" />
            </IconContainer>
            <span>{rest.join(' | ')}</span>
        </div>
    )
}

const renderDmlLine = (content: string) => {
    const [timestamp, ...parts] = content.split(/\s*\|\s*/)
    
    // Check if this line includes row count
    const rowsMatch = parts.join(' | ').match(/Rows: (\d+)$/)
    const rows = rowsMatch ? rowsMatch[1] : null

    // Remove rows from main content if it exists
    const mainContent = rows ? parts.join(' | ').replace(` | Rows: ${rows}`, '') : parts.join(' | ')

    return (
        <div className="flex items-center gap-3 w-full">
            <span className="text-gray-600 min-w-[60px]">{formatTimestamp(timestamp)}</span>
            <IconContainer color="#ee4de1">
                <Database className="text-white" />
            </IconContainer>
            <span className="flex-1">{mainContent}</span>
            {rows && <span className="text-gray-600 whitespace-nowrap">Rows: {rows}</span>}
        </div>
    )
}

const renderValidationLine = (content: string, details?: string) => {
    const [timestamp, ...rest] = content.split(/\s*\|\s*/)
    return (
        <div className="flex flex-col">
            {/* Header row */}
            <div className="flex gap-3">
                <div className="shrink-0">
                    <span className="text-gray-600 min-w-[60px] block">{formatTimestamp(timestamp)}</span>
                </div>
                <div className="flex-1 flex items-start gap-3">
                    <IconContainer color="#9333ea">
                        <Scale className="text-white" />
                    </IconContainer>
                    <span>{rest.join(' | ')}</span>
                </div>
            </div>
            {/* Formula row - aligned with content above */}
            {details && (
                <div className="flex gap-3">
                    <div className="shrink-0 min-w-[60px]" /> {/* Spacer for timestamp */}
                    <div className="flex-1 flex gap-3">
                        <div className="w-8" /> {/* Spacer for icon */}
                        <div className="flex-1 font-mono text-sm whitespace-pre-wrap">
                            {details}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const renderContent = (line: CollapsibleLine) => {
    switch (line.type) {
        case 'SOQL':
            return renderSoqlLine(line.summary)
        case 'FLOW':
            return renderFlowLine(line.summary)
        case 'CODE_UNIT':
            return renderCodeUnitLine(line.summary)
        case 'DEBUG':
            return renderDebugLine(line.summary)
        case 'DML':
            return renderDmlLine(line.summary)
        case 'VALIDATION':
            return renderValidationLine(line.summary, line.details)
        default:
            return <span>{line.summary}</span>
    }
}

export function LogViewer({ logs = [], isLoading, onCloseLog, tabStates, setTabStates, activeLogId }: LogViewerProps) {
    const [activeTab, setActiveTab] = useState<string>(activeLogId || '')
    const logContentRef = useRef<HTMLDivElement>(null)
    
    // Store state for each tab in a Record
    const [filteredLines, setFilteredLines] = useState<Record<string, CollapsibleLine[]>>({})

    // Update active tab when activeLogId changes
    useEffect(() => {
        if (activeLogId) {
            setActiveTab(activeLogId)
            // Initialize tab state if it doesn't exist
            if (!tabStates[activeLogId]) {
                setTabStates(prev => ({
                    ...prev,
                    [activeLogId]: {
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
            }
        }
    }, [activeLogId, setTabStates])
    
    // Initialize tab state when a new tab is added
    useEffect(() => {
        logs.forEach(log => {
            if (!tabStates[log.id]) {
                setTabStates((prev: Record<string, TabState>) => ({
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
            }
        })
    }, [logs])

    // Set initial active tab
    useEffect(() => {
        if (!activeTab && logs.length > 0) {
            setActiveTab(logs[0].id)
        }
    }, [logs])

    // Get current tab's state
    const currentTabState = tabStates[activeTab] || {
        prettyMode: false,
        debugOnly: false,
        searchQuery: '',
        showTimeline: false,
        showReplay: false,
        selectedLine: null,
        expandedLines: new Set(),
        selectedLineContent: { id: '', pretty: null, raw: null }
    }

    // Update state for current tab
    const updateTabState = (updates: Partial<TabState>) => {
        setTabStates((prev: Record<string, TabState>) => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                ...updates
            }
        }))
    }

    // Filter lines based on current tab's state
    useEffect(() => {
        const newFilteredLines: Record<string, CollapsibleLine[]> = {}
        
        logs.forEach(log => {
            const state = tabStates[log.id]
            if (!state || !log.content) {
                newFilteredLines[log.id] = []
                return
            }

            const allLines = log.content.split('\n')
            let processedLines = allLines.map((line: string, index: number) => ({
                line,
                originalIndex: index,
            }))

            if (state.debugOnly) {
                processedLines = processedLines.filter(({ line }: { line: string }) => line.includes('USER_DEBUG'))
            }

            if (state.searchQuery) {
                processedLines = processedLines.filter(({ line }: { line: string }) => 
                    line.toLowerCase().includes(state.searchQuery.toLowerCase())
                )
            }

            if (state.prettyMode) {
                const formattedLines = formatLogs(allLines)
                let filteredFormatted = formattedLines
                
                if (state.debugOnly) {
                    filteredFormatted = formattedLines.filter((line) => 
                        line.summary.includes('DEBUG')
                    )
                }
                
                if (state.searchQuery) {
                    filteredFormatted = filteredFormatted.filter((line) =>
                        line.summary.toLowerCase().includes(state.searchQuery.toLowerCase())
                    )
                }

                newFilteredLines[log.id] = filteredFormatted.map((line) => ({
                    ...line,
                    type: line.type as CollapsibleLine['type'],
                    isSelected: state.selectedLineContent?.id === `line_${line.originalIndex}`,
                }))
            } else {
                newFilteredLines[log.id] = processedLines.map(({ line, originalIndex }: { line: string, originalIndex: number }) => ({
                    id: `line_${originalIndex}`,
                    time: '',
                    summary: line,
                    type: 'STANDARD',
                    isCollapsible: false,
                    originalIndex,
                    isSelected: state.selectedLineContent?.id === `line_${originalIndex}`,
                }))
            }
        })

        setFilteredLines(newFilteredLines)
    }, [logs, tabStates])

    const toggleLine = (lineId: string) => {
        const newExpandedLines = new Set<string>(currentTabState.expandedLines)
        if (newExpandedLines.has(lineId)) {
            newExpandedLines.delete(lineId)
        } else {
            newExpandedLines.add(lineId)
        }
        updateTabState({ expandedLines: newExpandedLines })
    }

    const handleLineClick = (line: CollapsibleLine, isExpandToggle: boolean = false) => {
        if (isExpandToggle) {
            toggleLine(line.id)
            return
        }

        // Debug logging
        console.log('Clicked line details:', {
            id: line.id,
            originalIndex: line.originalIndex,
            currentSelectedId: currentTabState.selectedLineContent?.id,
        })

        // Handle deselection
        if (currentTabState.selectedLineContent?.id === `line_${line.originalIndex}`) {
            updateTabState({ selectedLineContent: { id: '', raw: null, pretty: null } })
            return
        }
        // Get raw line using the original index
        const rawLine = logs.find(log => log.id === activeTab)?.content?.split('\n')?.[line.originalIndex ?? 0] || null

        const newSelectedContent = {
            id: `line_${line.originalIndex}`,
            raw: rawLine,
            pretty: currentTabState.prettyMode ? `${line.time}|${line.summary}` : null,
        }

        console.log('Setting selected line content:', newSelectedContent)
        updateTabState({ selectedLineContent: newSelectedContent })
    }

    const handleCloseTab = (e: React.MouseEvent, logId: string) => {
        e.preventDefault()
        e.stopPropagation()
        
        // If we're closing the active tab, switch to another tab
        if (activeTab === logId) {
            const remainingLogs = logs.filter(log => log.id !== logId)
            if (remainingLogs.length > 0) {
                setActiveTab(remainingLogs[0].id)
            }
        }
        
        onCloseLog?.(logId)
    }

    const renderLine = (line: CollapsibleLine) => {
        const isSelected = currentTabState.selectedLineContent?.id === `line_${line.originalIndex}`

        const baseClasses = `
            py-1
            ${line.type === 'LIMITS' ? 'cursor-pointer bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white' : ''}
            ${isSelected ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
        `

        if (!currentTabState.prettyMode || !line.isCollapsible) {
            return (
                <div
                    className={baseClasses}
                    onClick={() => line.type !== 'LIMITS' && handleLineClick(line)}
                >
                    <div className="px-2">{renderContent(line)}</div>
                </div>
            )
        }

        const isExpanded = currentTabState.expandedLines.has(line.id)

        return (
            <div
                className={baseClasses}
                onClick={() => line.type !== 'LIMITS' && handleLineClick(line)}
            >
                <div className="flex items-center gap-2 px-2">{renderContent(line)}</div>
                {isExpanded && line.details && (
                    <div className="pl-8 py-2 bg-gray-50 dark:bg-gray-800 font-mono text-sm w-full whitespace-pre">{line.details}</div>
                )}
            </div>
        )
    }

    const handleEventClick = (lineNumber: number) => {
        updateTabState({ showTimeline: false })
        // Scroll to the line in the log
        if (logContentRef.current) {
            const lineElement = logContentRef.current.querySelector(`[data-line="${lineNumber}"]`)
            lineElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col h-full justify-center items-center">
                <MousePointerClick className="w-4 h-4 text-gray-500 dark:text-white animate-pulse" />
                <span className="text-sm text-gray-500 dark:text-white">
                    No logs to display
                </span>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <Tabs 
                value={activeTab}
                onValueChange={(value) => setActiveTab(value)}
            >
                {/* Controls bar - full width with proper spacing */}
                <div className="flex-none border-b border-gray-200 dark:border-gray-800 p-2">
                    <div className="flex items-center justify-between w-full">
                        {/* Left side with search */}
                        <div className="flex items-center gap-2 flex-1">
                            <Search className="w-4 h-4 text-gray-500" />
                            <Input
                                placeholder="Filter log lines..."
                                value={currentTabState.searchQuery}
                                onChange={(e) => updateTabState({ searchQuery: e.target.value })}
                                className="w-64"
                            />
                            <span className="text-sm text-gray-500">
                                Showing {filteredLines[activeTab]?.length || 0} lines
                            </span>
                        </div>

                        {/* Right side with controls */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="pretty-mode"
                                    checked={currentTabState.prettyMode}
                                    onCheckedChange={(checked) => updateTabState({ prettyMode: checked })}
                                />
                                <Label htmlFor="pretty-mode" className="text-sm text-gray-600 dark:text-white">
                                    Pretty
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="debug-mode"
                                    checked={currentTabState.debugOnly}
                                    onCheckedChange={(checked) => updateTabState({ debugOnly: checked })}
                                />
                                <Label htmlFor="debug-mode" className="text-sm text-gray-600 dark:text-white">
                                    Debug Only
                                </Label>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => updateTabState({ showTimeline: !currentTabState.showTimeline })}>
                                <LineChart className="w-4 h-4 mr-1" />
                                {currentTabState.showTimeline ? 'Hide Timeline' : 'Timeline'}
                            </Button>
                            <Button variant="outline" disabled size="sm" onClick={() => updateTabState({ showReplay: !currentTabState.showReplay })}>
                                {currentTabState.showReplay ? 'Hide Replay' : 'Replay'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs bar with close button */}
                <div className="flex-none border-b border-gray-200 dark:border-gray-800">
                    <TabsList className="w-full justify-start px-2">
                        {logs.map((log) => (
                            <TabsTrigger 
                                key={log.id} 
                                value={log.id} 
                                className="group relative pr-6 data-[state=inactive]:border data-[state=inactive]:border-gray-300 dark:data-[state=inactive]:border-gray-800"
                            >
                                {formatLogTime(log.time)} ({log.duration})
                                <div
                                    onClick={(e) => handleCloseTab(e, log.id)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 
                                             hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer
                                             opacity-0 group-hover:opacity-100 transition-opacity"
                                    role="button"
                                    aria-label={`Close ${formatLogTime(log.time)} tab`}
                                >
                                    <X className="h-3 w-3" />
                                </div>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* Tab content */}
                {logs.map((log) => (
                    <TabsContent
                        key={log.id}
                        value={log.id}
                        className="flex-1 overflow-hidden relative"
                    >
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                            </div>
                        )}

                        {currentTabState.showTimeline && (
                            <div className="flex-none border-b border-gray-200 dark:border-gray-800">
                                <TraceViewer
                                    content={log.content}
                                    onClose={() => updateTabState({ showTimeline: false })}
                                    onEventClick={handleEventClick}
                                />
                            </div>
                        )}

                        {currentTabState.showReplay && (
                            <div className="flex-none border-b border-gray-200 dark:border-gray-800">
                                <LogReplay 
                                    content={log.content} 
                                    onLineSelect={(line) => updateTabState({ selectedLine: line })} 
                                />
                            </div>
                        )}

                        <div className="flex-1 overflow-auto font-mono text-sm" ref={logContentRef}>
                            {filteredLines[log.id]?.map((line, index) => (
                                <div key={index} data-line={line.originalIndex}>{renderLine(line)}</div>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
