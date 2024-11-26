import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ChevronRight, ChevronDown, Clock, X } from 'lucide-react'
import * as d3 from 'd3'

interface TraceEvent {
    id: string
    name: string
    type: 'METHOD' | 'TRIGGER' | 'FLOW' | 'CALLOUT'
    startTime: number
    endTime: number
    duration: number
    level: number
    children: TraceEvent[]
    lineNumber: number
    timestamp: number
}

interface TraceViewerProps {
    content: string
    onClose: () => void
    onEventClick?: (lineNumber: number) => void
}

const getTypeColor = (type: TraceEvent['type']) => {
    switch (type) {
        case 'TRIGGER':
            return 'bg-orange-200 border-orange-400'
        case 'FLOW':
            return 'bg-blue-200 border-blue-400'
        case 'CALLOUT':
            return 'bg-purple-200 border-purple-400'
        default:
            return 'bg-gray-200 border-gray-400'
    }
}

interface TraceEventProps {
    event: TraceEvent
    xScale: (ms: number) => number
    timeStart: number
    labelWidth: number
    maxWidth: number
    onEventClick?: (lineNumber: number) => void
    getEventPosition?: (event: TraceEvent) => { left: number; width: number }
}

const TraceEvent = ({ event, xScale, timeStart, labelWidth, maxWidth, onEventClick }: TraceEventProps) => {
    const [isExpanded, setIsExpanded] = useState(true)

    // Calculate position and width
    const barStart = xScale(event.startTime - timeStart)
    const barWidth = Math.max(xScale(event.duration), 2)

    return (
        <div className="relative">
            <div className="flex items-center h-12 group hover:bg-gray-50">
                {/* Label section */}
                <div
                    className="flex items-center shrink-0 px-2"
                    style={{
                        width: `${labelWidth}px`,
                        paddingLeft: `${event.level * 20}px`,
                    }}
                >
                    {event.children.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsExpanded(!isExpanded)
                            }}
                            className="w-6 h-6 flex items-center justify-center shrink-0"
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}
                    <span className="text-sm truncate ml-2">{event.name}</span>
                </div>

                {/* Timeline bar section */}
                <div className="flex-1 relative h-full cursor-pointer" onClick={() => onEventClick?.(event.lineNumber)}>
                    <div
                        className={`absolute h-6 rounded border ${getTypeColor(event.type)} top-1/2 -translate-y-1/2`}
                        style={{
                            left: `${barStart}px`,
                            width: `${barWidth}px`,
                        }}
                    >
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs whitespace-nowrap">
                            {(event.duration / 1000).toFixed(3)}s
                        </div>
                    </div>
                </div>
            </div>

            {isExpanded &&
                event.children.map((child, index) => (
                    <TraceEvent
                        key={index}
                        event={child}
                        xScale={xScale}
                        timeStart={timeStart}
                        labelWidth={labelWidth}
                        maxWidth={maxWidth}
                        onEventClick={onEventClick}
                    />
                ))}
        </div>
    )
}

const TimeAxis = ({
    scale,
    height,
    ticks,
    formatTime,
    labelWidth,
}: {
    scale: d3.ScaleLinear<number, number>
    height: number
    ticks: number
    formatTime: (t: number) => string
    labelWidth: number
}) => {
    const tickValues = scale.ticks(ticks)

    return (
        <div className="relative" style={{ height: `${height}px`, marginLeft: `${labelWidth}px` }}>
            {tickValues.map((tick, i) => (
                <div key={i} className="absolute border-l border-gray-200 h-full" style={{ left: `${scale(tick)}px` }}>
                    <div className="relative -top-4 -translate-x-1/2 text-xs text-gray-500">{formatTime(tick)}</div>
                </div>
            ))}
        </div>
    )
}

export function TraceViewer({ content, onClose, onEventClick }: TraceViewerProps) {
    const events = parseLogEvents(content)

    // Constants for layout
    const LABEL_WIDTH = 300
    const RIGHT_MARGIN = 40
    const maxWidth = typeof window !== 'undefined' ? window.innerWidth * 0.9 - LABEL_WIDTH - RIGHT_MARGIN : 1000

    // Find the absolute start and end times from the log
    const firstTimestamp = events[0].timestamp // First event's timestamp
    const lastTimestamp = events.reduce((max, event) => {
        const eventEnd = event.timestamp + event.duration
        return Math.max(max, eventEnd)
    }, 0)

    const totalDuration = (lastTimestamp - firstTimestamp) / 1000 // Convert to seconds

    // Create scale for x-axis that maps from relative time to pixels
    const xScale = d3.scaleLinear().domain([0, totalDuration]).range([0, maxWidth])

    // Format time values for display
    const formatTime = (t: number) => `${t.toFixed(3)}s`

    // Calculate position and width for each event
    const getEventPosition = (event: TraceEvent) => {
        const relativeStart = (event.timestamp - firstTimestamp) / 1000
        const width = event.duration / 1000
        return {
            left: xScale(relativeStart),
            width: xScale(width) - xScale(0), // Convert duration to pixels
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Execution Timeline ({formatTime(totalDuration)} total)
                        </span>
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    {/* Time axis */}
                    <TimeAxis scale={xScale} height={30} ticks={10} formatTime={formatTime} labelWidth={LABEL_WIDTH} />

                    {/* Event rows */}
                    <div className="overflow-x-auto">
                        {events.map((event, i) => (
                            <TraceEvent
                                key={i}
                                event={event}
                                xScale={xScale}
                                timeStart={firstTimestamp}
                                labelWidth={LABEL_WIDTH}
                                maxWidth={maxWidth}
                                onEventClick={onEventClick}
                                getEventPosition={getEventPosition}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function parseTimestamp(timeStr: string, microsStr: string): number {
    const [hours, minutes, seconds] = timeStr.split(':')
    const baseSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds)
    return baseSeconds * 1000 + parseInt(microsStr) / 1000
}

function parseLogEvents(content: string): TraceEvent[] {
    const events: TraceEvent[] = []
    const stack: TraceEvent[] = []
    const lines = content.split('\n')

    // Find the first timestamp to use as reference
    const firstTimestamp =
        lines
            .map((line) => {
                const match = line.match(/(\d{2}:\d{2}:\d{2}\.\d+)\s*\((\d+)\)/)
                return match ? parseTimestamp(match[1], match[2]) : null
            })
            .filter(Boolean)[0] || 0

    lines.forEach((line, lineNumber) => {
        const match = line.match(
            /(\d{2}:\d{2}:\d{2}\.\d+)\s*\((\d+)\)\|CODE_UNIT_(STARTED|FINISHED)\|.*?\|([^|]+)(?:\|([^|]+))?/,
        )
        if (!match) return

        const [, timeStr, microsStr, eventType, id, name] = match
        const timestamp = parseTimestamp(timeStr, microsStr) - firstTimestamp // Normalize relative to start

        if (eventType === 'STARTED') {
            const event: TraceEvent = {
                id,
                name: name || id,
                type: determineEventType(name || id),
                startTime: timestamp,
                endTime: 0,
                duration: 0,
                level: stack.length,
                children: [],
                lineNumber,
                timestamp,
            }

            if (stack.length > 0) {
                stack[stack.length - 1].children.push(event)
            } else {
                events.push(event)
            }

            stack.push(event)
        } else if (eventType === 'FINISHED') {
            const currentEvent = stack.pop()
            if (currentEvent && currentEvent.id === id) {
                currentEvent.endTime = timestamp
                currentEvent.duration = currentEvent.endTime - currentEvent.startTime
            }
        }
    })

    return events
}

function determineEventType(name: string): TraceEvent['type'] {
    if (name.toLowerCase().includes('trigger')) return 'TRIGGER'
    if (name.toLowerCase().includes('flow')) return 'FLOW'
    if (name.toLowerCase().includes('callout')) return 'CALLOUT'
    return 'METHOD'
}
