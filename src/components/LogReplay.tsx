import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, SkipForward, SkipBack, ChevronRight, Circle } from 'lucide-react'

interface LogLine {
    timestamp: string
    type:
        | 'CODE_UNIT_STARTED'
        | 'CODE_UNIT_FINISHED'
        | 'VARIABLE_ASSIGNMENT'
        | 'METHOD_ENTRY'
        | 'METHOD_EXIT'
        | 'CONSTRUCTOR_ENTRY'
        | 'CONSTRUCTOR_EXIT'
        | 'SYSTEM_METHOD_ENTRY'
        | 'SYSTEM_METHOD_EXIT'
        | 'CHECKPOINT'
        | 'USER_DEBUG'
    details: string
    variables?: { [key: string]: any }
    lineNumber?: number
    stackDepth: number
}

interface LogReplayProps {
    content: string
    onLineSelect?: (line: number) => void
}

export function LogReplay({ content, onLineSelect }: LogReplayProps) {
    const [parsedLines, setParsedLines] = useState<LogLine[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const [variables, setVariables] = useState<{ [key: string]: any }>({})
    const [stack, setStack] = useState<string[]>([])

    // Parse log content into structured format
    useEffect(() => {
        if (!content) return

        const lines = content
            .split('\n')
            .map((line, index) => {
                const parsedLine = parseLine(line)
                if (!parsedLine) return null
                return {
                    ...parsedLine,
                    originalIndex: index,
                }
            })
            .filter((line): line is LogLine & { originalIndex: number } => line !== null)

        setParsedLines(lines)
    }, [content])

    // Playback control
    useEffect(() => {
        if (!isPlaying) return

        const interval = setInterval(() => {
            setCurrentIndex((i) => {
                if (i >= parsedLines.length - 1) {
                    setIsPlaying(false)
                    return i
                }
                return i + 1
            })
        }, 1000 / playbackSpeed)

        return () => clearInterval(interval)
    }, [isPlaying, playbackSpeed, parsedLines.length])

    // Update variables and stack based on current line
    useEffect(() => {
        const line = parsedLines[currentIndex]
        if (!line) return

        // Update call stack
        if (line.type === 'METHOD_ENTRY' || line.type === 'CONSTRUCTOR_ENTRY') {
            setStack((prev) => [...prev, line.details])
        } else if (line.type === 'METHOD_EXIT' || line.type === 'CONSTRUCTOR_EXIT') {
            setStack((prev) => prev.slice(0, -1))
        }

        // Update variables
        if (line.variables) {
            setVariables((prev) => ({
                ...prev,
                ...line.variables,
            }))
        }

        // Notify parent of line selection
        if (line.lineNumber && onLineSelect) {
            onLineSelect(line.lineNumber)
        }
    }, [currentIndex, parsedLines, onLineSelect])

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Playback controls */}
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentIndex(0)}>
                    <SkipBack className="w-4 h-4" />
                </Button>

                <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex((i) => Math.min(i + 1, parsedLines.length - 1))}
                >
                    <SkipForward className="w-4 h-4" />
                </Button>
            </div>

            {/* Current execution context */}
            <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Call Stack</h3>
                <div className="space-y-1">
                    {stack.map((call, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm" style={{ marginLeft: `${i * 12}px` }}>
                            <ChevronRight className="w-4 h-4" />
                            {call}
                        </div>
                    ))}
                </div>
            </div>

            {/* Variables panel */}
            <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Variables</h3>
                <div className="space-y-1">
                    {Object.entries(variables).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                            <span className="font-mono">{key}:</span>
                            <span className="text-gray-600">{JSON.stringify(value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Helper function to parse log lines
function parseLine(line: string): LogLine | null {
    const timestamp = line.match(/(\d{2}:\d{2}:\d{2}\.\d+)/)?.[1]
    if (!timestamp) return null

    // Match different log line patterns
    const methodEntry = line.match(/METHOD_ENTRY\|.*\|([^|]+)/)
    const methodExit = line.match(/METHOD_EXIT\|.*\|([^|]+)/)
    const varAssignment = line.match(/VARIABLE_ASSIGNMENT\|.*\|([^|]+)\|([^|]+)/)
    const checkpoint = line.match(/CHECKPOINT\|.*\|(\d+)\|(.*)/)

    if (methodEntry) {
        return {
            timestamp,
            type: 'METHOD_ENTRY',
            details: methodEntry[1],
            stackDepth: (line.match(/\|/g) || []).length,
        }
    }

    if (methodExit) {
        return {
            timestamp,
            type: 'METHOD_EXIT',
            details: methodExit[1],
            stackDepth: (line.match(/\|/g) || []).length,
        }
    }

    if (varAssignment) {
        return {
            timestamp,
            type: 'VARIABLE_ASSIGNMENT',
            details: varAssignment[1],
            variables: {
                [varAssignment[1]]: varAssignment[2],
            },
            stackDepth: (line.match(/\|/g) || []).length,
        }
    }

    if (checkpoint) {
        return {
            timestamp,
            type: 'CHECKPOINT',
            details: checkpoint[2],
            lineNumber: parseInt(checkpoint[1]),
            stackDepth: (line.match(/\|/g) || []).length,
        }
    }

    // Add more patterns as needed

    return null
}
