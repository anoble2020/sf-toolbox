import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronDown, Clock } from 'lucide-react';

interface TraceEvent {
  id: string;
  name: string;
  type: 'METHOD' | 'TRIGGER' | 'FLOW' | 'CALLOUT';
  startTime: number;
  endTime: number;
  duration: number;
  level: number;
  children: TraceEvent[];
}

const getTypeColor = (type: TraceEvent['type']) => {
  switch (type) {
    case 'TRIGGER':
      return 'bg-orange-200 border-orange-400';
    case 'FLOW':
      return 'bg-blue-200 border-blue-400';
    case 'CALLOUT':
      return 'bg-purple-200 border-purple-400';
    default:
      return 'bg-gray-200 border-gray-400';
  }
};

const TraceEvent = ({ 
  event, 
  xScale, 
  timeStart, 
  level = 0, 
  maxWidth 
}: { 
  event: TraceEvent;
  xScale: (ms: number) => number;
  timeStart: number;
  level?: number;
  maxWidth: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const left = xScale(event.startTime - timeStart);
  const width = Math.max(xScale(event.duration), 20);

  return (
    <div className="relative">
      <div 
        className="flex items-center h-12 group"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {event.children?.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute left-0 w-4 h-4 -ml-5 text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        
        <div className="w-48 pr-4 text-xs font-medium truncate">
          {event.name}
        </div>
        
        <div className="relative flex-grow h-8">
          <div
            className={`absolute h-full rounded border ${getTypeColor(event.type)} hover:shadow-md transition-shadow`}
            style={{
              left: `${left}px`,
              width: `${Math.min(width, maxWidth - left)}px`
            }}
          >
            <div className="absolute inset-0 px-2 py-1 text-xs truncate">
              {event.duration}ms
            </div>
          </div>
        </div>
        
        <div className="invisible absolute left-48 ml-2 bg-gray-800 text-white px-2 py-1 rounded text-xs group-hover:visible z-50">
          Duration: {event.duration}ms
          <br />
          Type: {event.type}
        </div>
      </div>
      
      {isExpanded && event.children?.map((child, index) => (
        <TraceEvent
          key={index}
          event={child}
          xScale={xScale}
          timeStart={timeStart}
          level={level + 1}
          maxWidth={maxWidth}
        />
      ))}
    </div>
  );
};

export function TraceViewer({ content }: { content: string }) {
  const events = parseLogEvents(content);
  
  // Calculate timeline boundaries
  const timeStart = Math.min(...events.map(e => e.startTime));
  const timeEnd = Math.max(...events.map(e => e.endTime));
  const totalDuration = timeEnd - timeStart;

  // Scale function to convert milliseconds to pixels
  const xScale = (ms: number) => (ms / 100) * 5; // 5px per 100ms
  const maxWidth = xScale(totalDuration);

  return (
    <Card className="w-full">
      <CardHeader className="py-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock size={16} />
          Execution Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div style={{ minWidth: `${maxWidth + 300}px` }}>
          {/* Time scale */}
          <div className="flex h-8 ml-48 border-b">
            {Array.from({ length: Math.ceil(totalDuration / 1000) + 1 }).map((_, i) => (
              <div
                key={i}
                className="text-xs text-gray-500"
                style={{ width: `${xScale(1000)}px` }}
              >
                {i * 1000}ms
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex gap-4 ml-48 my-2">
            {[
              { type: 'METHOD' as const, label: 'Method' },
              { type: 'TRIGGER' as const, label: 'Trigger' },
              { type: 'FLOW' as const, label: 'Flow' },
              { type: 'CALLOUT' as const, label: 'Callout' }
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center text-xs">
                <div className={`w-3 h-3 mr-1 rounded ${getTypeColor(type)}`} />
                {label}
              </div>
            ))}
          </div>
          
          {/* Events */}
          <div className="mt-4">
            {events.map((event, index) => (
              <TraceEvent
                key={index}
                event={event}
                xScale={xScale}
                timeStart={timeStart}
                maxWidth={maxWidth}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function parseLogEvents(content: string): TraceEvent[] {
  const events: TraceEvent[] = [];
  const stack: TraceEvent[] = [];
  const lines = content.split('\n');
  
  const timeRegex = /(\d{2}:\d{2}:\d{2}\.?\d*)/;
  const methodEntryRegex = /METHOD_ENTRY\|.*\|(.+)/;
  const methodExitRegex = /METHOD_EXIT\|.*\|(.+)/;
  const triggerRegex = /CODE_UNIT_(STARTED|FINISHED)\|.*\|(.+)/;
  
  let baseTime: number | null = null;

  lines.forEach(line => {
    const timeMatch = line.match(timeRegex);
    if (!timeMatch) return;

    const timestamp = timeMatch[1];
    const time = new Date(`2024-01-01 ${timestamp}`).getTime();
    if (baseTime === null) baseTime = time;

    const relativeTime = time - (baseTime || 0);

    // Method entry
    const methodEntryMatch = line.match(methodEntryRegex);
    if (methodEntryMatch) {
      const event: TraceEvent = {
        id: `method_${events.length}`,
        name: methodEntryMatch[1],
        type: 'METHOD',
        startTime: relativeTime,
        endTime: relativeTime,
        duration: 0,
        level: stack.length,
        children: []
      };
      
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(event);
      } else {
        events.push(event);
      }
      stack.push(event);
      return;
    }

    // Method exit
    const methodExitMatch = line.match(methodExitRegex);
    if (methodExitMatch && stack.length > 0) {
      const event = stack.pop();
      if (event) {
        event.endTime = relativeTime;
        event.duration = event.endTime - event.startTime;
      }
      return;
    }

    // Trigger/Flow events
    const triggerMatch = line.match(triggerRegex);
    if (triggerMatch) {
      const [_, action, name] = triggerMatch;
      if (action === 'STARTED') {
        const event: TraceEvent = {
          id: `trigger_${events.length}`,
          name,
          type: name.includes('flow') ? 'FLOW' : 'TRIGGER',
          startTime: relativeTime,
          endTime: relativeTime,
          duration: 0,
          level: stack.length,
          children: []
        };
        
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(event);
        } else {
          events.push(event);
        }
        stack.push(event);
      } else if (action === 'FINISHED' && stack.length > 0) {
        const event = stack.pop();
        if (event) {
          event.endTime = relativeTime;
          event.duration = event.endTime - event.startTime;
        }
      }
    }
  });

  return events;
} 