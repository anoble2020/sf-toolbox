interface LimitUsage {
  namespace: string;
  metrics: {
    [key: string]: {
      used: number;
      total: number;
    };
  };
}

interface FormattedLine {
  id: string;
  time: string;
  summary: string;
  details?: string;
  type: 'SOQL' | 'JSON' | 'STANDARD' | 'LIMITS';
  isCollapsible?: boolean;
  suffix?: string;
}

function tryFormatJson(str: string): { formatted: string; isJson: boolean; preview: string } {
  try {
    const jsonStart = str.indexOf('[') || str.indexOf('{');
    if (jsonStart === -1) return { formatted: str, isJson: false, preview: '' };
    
    const jsonStr = str.slice(jsonStart);
    const parsed = JSON.parse(jsonStr);
    const formatted = JSON.stringify(parsed, null, 2);
    
    // Create preview by taking first 2-3 key-value pairs
    const preview = JSON.stringify(parsed)
      .replace(/^\{|\}$/g, '') // Remove outer braces
      .split(',')
      .slice(0, 2)
      .join(', ') + (Object.keys(parsed).length > 2 ? ' ...' : '');
    
    return { 
      formatted,
      isJson: true,
      preview
    };
  } catch (e) {
    return { formatted: str, isJson: false, preview: '' };
  }
}

export function formatLogLine(line: string, index: number, allLines: string[]): FormattedLine {
  const baseId = `line_${index}_${Date.now()}`; // Make IDs unique
  
  // Extract timestamp without the number in parentheses
  const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})\.(\d+)\s*\(\d+\)\|/);
  if (!timeMatch) {
    return {
      id: baseId,
      time: '',
      summary: line,
      type: 'STANDARD'
    };
  }

  const [fullMatch, time] = timeMatch;
  let cleanLine = line.replace(fullMatch, `${time}|`);

  // Format USER_DEBUG with JSON detection
  if (cleanLine.includes('USER_DEBUG')) {
    const debugMatch = cleanLine.match(/USER_DEBUG\|\[(\d+)\]\|(DEBUG|INFO|WARN|ERROR)\|(.*)/);
    if (debugMatch) {
      const [_, lineNum, level, message] = debugMatch;
      const { formatted, isJson, preview } = tryFormatJson(message);
      const emoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '🔍';
      
      return {
        id: baseId,
        time,
        summary: `${emoji} Debug [${lineNum}]${isJson ? `: {${preview}}` : `: ${message}`}`,
        details: isJson ? formatted : undefined,
        type: isJson ? 'JSON' : 'STANDARD',
        isCollapsible: isJson
      };
    }
  }

  // Don't return null for CUMULATIVE_LIMIT_USAGE anymore
  // Instead, let it pass through to be handled by formatLimitUsage
  return {
    id: baseId,
    time,
    summary: cleanLine,
    type: 'STANDARD'
  };
}

export function formatLogs(lines: string[]): FormattedLine[] {
  const formattedLines: FormattedLine[] = [];
  let collectingLimits = false;
  let limitData: { [key: string]: { used: number; total: number } } = {};
  let currentTime = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    console.log('Processing line:', line);
    
    // Extract timestamp for all lines
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
    if (timeMatch) {
      currentTime = timeMatch[1];
    }

    // Handle cumulative usage sections - use exact matches
    if (line.includes('CUMULATIVE_LIMIT_USAGE') && !line.includes('CUMULATIVE_LIMIT_USAGE_END')) {
      collectingLimits = true;
      continue;
    }

    if (line.includes('CUMULATIVE_LIMIT_USAGE_END')) {
      const metrics = [];
      console.log('Collected limits:', limitData);

      metrics.push('Limits');
      
      // SOQL metrics - only include if there are actual queries or rows
      if (limitData['Number of SOQL queries']?.used > 0 || limitData['Number of query rows']?.used > 0) {
        metrics.push(`🔍 SOQL: ${limitData['Number of SOQL queries'].used}/${limitData['Number of SOQL queries'].total} Queries, ${limitData['Number of query rows'].used}/${limitData['Number of query rows'].total} Rows`);
      }
      
      // DML metrics - only include if there are actual statements or rows
      if (limitData['Number of DML statements']?.used > 0 || limitData['Number of DML rows']?.used > 0) {
        metrics.push(`🔶 DML: ${limitData['Number of DML statements'].used}/${limitData['Number of DML statements'].total} Statements, ${limitData['Number of DML rows'].used}/${limitData['Number of DML rows'].total} Rows`);
      }
      
      // CPU and Heap - only include if CPU time was used
      if (limitData['Maximum CPU time']?.used > 0) {
        const heapUsedKB = Math.round(limitData['Maximum heap size'].used / 1024);
        const heapTotalKB = Math.round(limitData['Maximum heap size'].total / 1024);
        metrics.push(`💻 CPU: ${limitData['Maximum CPU time'].used}ms, Heap: ${heapUsedKB}/${heapTotalKB}KB`);
      }

      // Only create and add the formatted line if we have non-zero metrics
      if (metrics.length > 0) {
        formattedLines.push({
          id: `limit_${i}_${Date.now()}`,
          time: currentTime,
          summary: metrics.join(' | '),
          type: 'LIMITS',
          isCollapsible: false
        });
      }
      
      collectingLimits = false;
      limitData = {};
      continue;
    }

    if (collectingLimits) {
      // Parse limit data - adjust regex to handle lines without timestamps
      const metricMatch = line.match(/^(.*?):\s*(\d+)\s*out of\s*(\d+)/);
      if (metricMatch) {
        const [_, name, used, total] = metricMatch;
        limitData[name.trim()] = {
          used: parseInt(used),
          total: parseInt(total)
        };
      }
      continue;
    }

    // Handle regular lines through formatLogLine
    const formattedLine = formatLogLine(line, i, lines);
    if (formattedLine) {
      formattedLines.push(formattedLine);
    }
  }

  return formattedLines;
} 