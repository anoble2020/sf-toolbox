import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { X } from 'lucide-react'

interface TimelineProps {
    logContent: string
    onClose: () => void
    onEventClick: (lineNumber: number) => void
}

interface LogEvent {
    id: string
    name: string
    start: number
    end: number
    level: number
    lineNumber: number
}

export function Timeline({ logContent, onClose, onEventClick }: TimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [debug, setDebug] = useState<string[]>([])

    console.log('rendering timeline')

    useEffect(() => {
        if (!containerRef.current) return

        const addDebug = (msg: string) => {
            setDebug((prev) => [...prev, msg])
        }

        try {
            addDebug('Parsing events...')
            const events = parseLogEvents(logContent)
            addDebug(`Found ${events.length} events`)

            const diagram = generateGanttDiagram(events)
            addDebug('Generated diagram definition:')
            addDebug(diagram)

            mermaid.initialize({
                startOnLoad: true,
                theme: 'default',
                gantt: {
                    titleTopMargin: 25,
                    barHeight: 20,
                    barGap: 4,
                    topPadding: 50,
                    numberSectionStyles: 4,
                    fontSize: 12,
                    useWidth: 1000,
                },
                securityLevel: 'loose',
            })

            const handleClick = (e: MouseEvent) => {
                const target = e.target as SVGElement
                if (target.closest('.task')) {
                    const taskId = target.closest('.task')?.id
                    const event = events.find((e) => e.id === taskId)
                    if (event) {
                        onEventClick(event.lineNumber)
                    }
                }
            }

            mermaid
                .render('timeline-diagram', diagram)
                .then(({ svg }) => {
                    if (containerRef.current) {
                        containerRef.current.innerHTML = svg
                        containerRef.current.addEventListener('click', handleClick)
                    }
                })
                .catch((err) => {
                    setError(err.message)
                })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }, [logContent])

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] w-[1200px] relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Execution Timeline</h2>
                    {error && <div className="mb-4 p-2 bg-red-50 text-red-700 rounded">Error: {error}</div>}
                    <div ref={containerRef} className="w-full overflow-x-auto" />
                </div>
            </div>
        </div>
    )
}

const parseTimestamp = (timestamp: string): number => {
    // Split into time and microseconds: "06:01:24.0 (16781155)"
    const [timeStr, microsStr] = timestamp.split(' (')

    // Parse the base time
    const [hours, minutes, seconds] = timeStr.split(':')
    const baseDate = new Date(2024, 0, 1) // Use arbitrary date since we only care about time
    baseDate.setHours(parseInt(hours))
    baseDate.setMinutes(parseInt(minutes))
    baseDate.setSeconds(parseFloat(seconds))

    // Add microseconds if present
    if (microsStr) {
        const micros = parseInt(microsStr.replace(')', '')) / 1000 // Convert to milliseconds
        return baseDate.getTime() + micros
    }

    return baseDate.getTime()
}

const parseLogEvents = (content: string): LogEvent[] => {
    const events: LogEvent[] = []
    const stack: LogEvent[] = []
    const lines = content.split('\n')

    lines.forEach((line) => {
        if (!line.includes('CODE_UNIT_')) return

        const [timestamp, , eventType, , id, name] = line.split('|')
        const time = parseTimestamp(timestamp)

        if (eventType === 'CODE_UNIT_STARTED') {
            const level = stack.length
            const event: LogEvent = {
                id,
                name,
                start: time,
                end: 0, // Will be set when we find the matching FINISHED event
                level,
                lineNumber: lines.indexOf(line),
            }
            events.push(event)
            stack.push(event)
        } else if (eventType === 'CODE_UNIT_FINISHED') {
            const matchingEvent = stack.pop()
            if (matchingEvent && matchingEvent.id === id) {
                matchingEvent.end = time
            }
        }
    })

    // Remove any events that don't have an end time
    return events.filter((e) => e.end > 0)
}

const generateGanttDiagram = (events: LogEvent[]): string => {
    const minTime = Math.min(...events.map((e) => e.start))
    let diagram = 'gantt\n'
    diagram += 'dateFormat x\n' // Use raw numbers for dates
    diagram += 'axisFormat %L\n' // Show milliseconds

    events.forEach((event) => {
        const startOffset = event.start - minTime
        const duration = event.end - event.start
        const indent = '  '.repeat(event.level)
        diagram += `${indent}section ${event.name}\n`
        diagram += `${indent}${event.name} :${startOffset}, ${duration}\n`
    })

    return diagram
}
