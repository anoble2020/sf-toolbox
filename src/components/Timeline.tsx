import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface TimelineProps {
  logContent: string
}

interface LogEvent {
  id: string
  name: string
  start: string
  end: string
  level: number
}

export function Timeline({ logContent }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    const addDebug = (msg: string) => {
      setDebug(prev => [...prev, msg])
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
          sidePadding: 75,
          numberSectionStyles: 4
        },
        securityLevel: 'loose'
      })

      const uniqueId = `timeline-diagram-${Date.now()}`
      
      mermaid.render(uniqueId, diagram)
        .then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg
          }
        })
        .catch(err => {
          setError(err.message)
          addDebug(`Render error: ${err.message}`)
        })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      addDebug(`Processing error: ${err}`)
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        // Clear the container's contents before unmounting
        containerRef.current.innerHTML = '';
      }
    };
  }, [logContent])

  return (
    <div className="p-4">
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      <div ref={containerRef} className="w-full overflow-x-auto" />
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs font-mono">
        <pre>{debug.join('\n')}</pre>
      </div>
    </div>
  )
}

function parseLogEvents(content: string): LogEvent[] {
  const events: LogEvent[] = []
  const lines = content.split('\n')
  const regex = /(\d{2}:\d{2}:\d{2}\.?\d*)\s*\(\d+\)\|(CODE_UNIT_(?:STARTED|FINISHED))\|(?:\[EXTERNAL\]\|)?(.+)/
  const baseDate = '2024-01-01 '
  
  // First pass: collect start times
  const startEvents = new Map<string, { time: string, name: string }>()
  
  lines.forEach(line => {
    const match = line.match(regex)
    if (match) {
      const [_, timestamp, eventType, details] = match
      const formattedTime = baseDate + timestamp.replace(/(\d{2}:\d{2}:\d{2})\.?(\d*)/, (_, time, ms) => {
        return `${time}.${ms.padEnd(3, '0').slice(0, 3)}`
      })
      
      // Handle both trigger and non-trigger events
      const eventKey = details.includes('|') ? details : details.replace(/\[EXTERNAL\]\|/, '')
      
      if (eventType === 'CODE_UNIT_STARTED') {
        startEvents.set(eventKey, { time: formattedTime, name: details })
      } else if (eventType === 'CODE_UNIT_FINISHED') {
        const startEvent = startEvents.get(eventKey)
        if (startEvent) {
          events.push({
            id: `event_${events.length}`,
            name: details,
            start: startEvent.time,
            end: formattedTime,
            level: 0
          })
          startEvents.delete(eventKey)
        }
      }
    }
  })
  
  // Calculate levels for overlapping events
  events.sort((a, b) => a.start.localeCompare(b.start))
  
  events.forEach((event, i) => {
    let level = 0
    let overlap = true
    while (overlap) {
      overlap = false
      for (let j = 0; j < i; j++) {
        if (events[j].level === level && 
            event.start <= events[j].end && 
            event.end >= events[j].start) {
          overlap = true
          break
        }
      }
      if (overlap) level++
    }
    event.level = level
  })
  
  return events
}

function generateGanttDiagram(events: LogEvent[]): string {
  const diagram = [
    'gantt',
    '    dateFormat YYYY-MM-DD HH:mm:ss.S',
    '    axisFormat %H:%M:%S.%L',
    '    section timeline',
    ''
  ]
  
  events.forEach(event => {
    const startTime = new Date(event.start).getTime()
    const endTime = new Date(event.end).getTime()
    const durationMs = endTime - startTime
    const durationS = Math.max(durationMs / 1000, 0.001)
    
    // Clean up the name for display
    const displayName = event.name
      .replace(/\[EXTERNAL\]\|/, '')
      .replace(/\|__sfdc_trigger\//g, '')
      .replace(/\|/g, ' - ')
      .trim()
    
    // Create a unique ID that includes the level for proper stacking
    const sanitizedId = `${displayName}_${event.level}`
      .replace(/[^\w]/g, '_')
      .toLowerCase()
    
    // Add task definition with explicit start and duration
    diagram.push(`    ${sanitizedId} :done, ${displayName}, ${event.start}, ${durationS}s`)
  })
  
  return diagram.join('\n')
} 