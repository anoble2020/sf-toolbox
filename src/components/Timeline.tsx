import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface TimelineProps {
  logContent: string
}

export function Timeline({ logContent }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const events = parseLogEvents(logContent)
    const diagram = generateMermaidDiagram(events)
    
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'neutral',
      sequence: {
        showSequenceNumbers: false,
        actorMargin: 50,
        messageMargin: 40,
        mirrorActors: false,
        wrap: true,
        height: 40,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
      }
    })

    mermaid.render('timeline-diagram', diagram).then(({ svg }) => {
      if (containerRef.current) {
        containerRef.current.innerHTML = svg
      }
    }).catch(error => {
      console.error('Mermaid rendering error:', error)
    })
  }, [logContent])

  return (
    <div ref={containerRef} className="w-full overflow-x-auto p-4" />
  )
}

function parseLogEvents(content: string) {
  const events: Array<{time: string, event: string}> = []
  const lines = content.split('\n')
  
  // Match Salesforce timestamp and event pattern
  const regex = /(\d{2}:\d{2}:\d{2}\.\d+)\s*\(\d+\)\|([^|]+)/
  
  lines.forEach(line => {
    const match = line.match(regex)
    if (match && !line.includes('LIMIT_USAGE') && !line.includes('USER_INFO')) {
      events.push({
        time: match[1],
        event: match[2].trim()
      })
    }
  })
  
  return events
}

function generateMermaidDiagram(events: Array<{time: string, event: string}>) {
  const diagram = ['sequenceDiagram', '    participant System', '    participant Process']
  
  events.forEach(({ time, event }) => {
    // Sanitize event text for Mermaid
    const sanitizedEvent = event.replace(/[^\w\s-]/g, '_').substring(0, 50)
    diagram.push(`    Note over System,Process: ${time}`)
    diagram.push(`    System->>Process: ${sanitizedEvent}`)
  })
  
  return diagram.join('\n')
} 