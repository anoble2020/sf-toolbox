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
  type: 'SOQL' | 'JSON' | 'STANDARD' | 'LIMITS' | 'CODE_UNIT';
  isCollapsible?: boolean;
  suffix?: string;
  nestLevel?: number;
  unitId?: string;
  isUnitStart?: boolean;
  isUnitEnd?: boolean;
  originalIndex?: number;
}

function tryFormatJson(str: string): { formatted: string; isJson: boolean; preview: string } {
  try {
    const jsonStart = str.indexOf('[') || str.indexOf('{');
    if (jsonStart === -1) return { formatted: str, isJson: false, preview: '' };
    
    const jsonStr = str.slice(jsonStart);
    const parsed = JSON.parse(jsonStr);
    const formatted = JSON.stringify(parsed, null, 2);
    
    const preview = JSON.stringify(parsed)
      .replace(/^\{|\}$/g, '')
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

export function formatLogLine(line: string, originalIndex: number, allLines: string[]): FormattedLine {
  const baseId = `line_${originalIndex}`;
  
  const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})\.(\d+)\s*\(\d+\)\|/);
  if (!timeMatch) {
    return {
      id: baseId,
      time: '',
      summary: line,
      type: 'STANDARD',
      originalIndex
    };
  }

  const [fullMatch, time] = timeMatch;
  let cleanLine = line.replace(fullMatch, `${time}|`);

  if (!cleanLine.includes('USER_DEBUG')) {
    cleanLine = cleanLine.replace(/\[EXTERNAL\]\|/, '');
  }

  if (cleanLine.includes('USER_DEBUG')) {
    const debugMatch = cleanLine.match(/USER_DEBUG\|\[(\d+)\]\|(DEBUG|INFO|WARN|ERROR)\|(.*)/);
    if (debugMatch) {
      const [_, lineNum, level, message] = debugMatch;
      const { formatted, isJson, preview } = tryFormatJson(message);
      const emoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '🪲';
      
      if (isJson) {
        return {
          id: baseId,
          time,
          summary: `${emoji} Debug [${lineNum}]: {${preview}}`,
          details: formatted,
          type: 'JSON',
          isCollapsible: true,
          originalIndex
        };
      }
      
      if (message.length > 200) {
        return {
          id: baseId,
          time,
          summary: `${emoji} Debug [${lineNum}]: ${message.substring(0, 200)}...`,
          details: message,
          type: 'STANDARD',
          isCollapsible: true,
          originalIndex
        };
      }
      
      return {
        id: baseId,
        time,
        summary: `${emoji} Debug [${lineNum}]: ${message}`,
        type: 'STANDARD',
        isCollapsible: false,
        originalIndex
      };
    }
  }

  return {
    id: baseId,
    time,
    summary: cleanLine,
    type: 'STANDARD',
    originalIndex
  };
}

// Add SQL keywords to be bolded
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'LIMIT', 
  'ORDER BY', 'GROUP BY', 'IN', 'LIKE', 'TYPEOF', 
  'OFFSET', 'HAVING', 'INCLUDES', 'EXCLUDES', 'NOT'
];

function boldSqlKeywords(sql: string): string {
  let result = sql;
  SQL_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    result = result.replace(regex, `**${keyword}**`);
  });
  return result;
}

export function formatLogs(lines: string[]): FormattedLine[] {
  const formattedLines: FormattedLine[] = [];
  let collectingLimits = false;
  let limitData: { [key: string]: { used: number; total: number } } = {};
  let currentTime = '';

  // First pass: create array with original indices
  const validLines = lines.map((line, index) => ({
    content: line.trim(),
    originalIndex: index
  })).filter(({ content }) => {
    // Filter out empty lines and standalone zeros
    if (!(content.match(/\d{2}:\d{2}:\d{2}/) || (content !== '0' && content !== ''))) {
      return false;
    }

    // Filter out SYSTEM_MODE and SYSTEM_METHOD lines
    if (content.includes('SYSTEM_MODE_ENTER') || 
        content.includes('SYSTEM_MODE_EXIT') ||
        content.includes('SYSTEM_METHOD_ENTER') ||
        content.includes('SYSTEM_METHOD_EXIT')) {
      return false;
    }

    return true;
  });

  for (let i = 0; i < validLines.length; i++) {
    const { content, originalIndex } = validLines[i];
    const nextLine = i < validLines.length - 1 ? validLines[i + 1].content : '';
    
    const timeMatch = content.match(/(\d{2}:\d{2}:\d{2})/);
    if (timeMatch) {
      currentTime = timeMatch[1];
    }

    // Handle SOQL execution pairs
    const soqlBeginMatch = content.match(/\|SOQL_EXECUTE_BEGIN\|(\[(\d+)\])(.*)/);
    if (soqlBeginMatch) {
      let rowCount = '';
      let aggregations = '';
      
      // Extract line number and any aggregations info
      const [_, bracketsFull, lineNumber, restOfQuery] = soqlBeginMatch;
      const aggregationsMatch = restOfQuery.match(/\|Aggregations:(\d+)\|/);
      if (aggregationsMatch) {
        aggregations = ` | Aggregations: ${aggregationsMatch[1]}`;
      }
      
      if (nextLine && nextLine.includes('SOQL_EXECUTE_END')) {
        const rowMatch = nextLine.match(/\|Rows:(\d+)/);
        if (rowMatch) {
          rowCount = ` | Rows: ${rowMatch[1]}`;
          i++; // Skip the END line
        }
      }

      const formattedLine = formatLogLine(content, originalIndex, lines);
      const sqlQuery = restOfQuery.replace(/\|Aggregations:\d+\|/, '').trim();
      
      formattedLines.push({
        ...formattedLine,
        summary: `${formattedLine.time} | [${lineNumber}] | ${boldSqlKeywords(sqlQuery)}${aggregations}${rowCount}`,
        type: 'SOQL',
        isCollapsible: false,
        originalIndex
      });
      continue;
    }

    // Skip SOQL_EXECUTE_END lines as they're handled above
    if (content.includes('SOQL_EXECUTE_END')) {
      continue;
    }

    // Handle regular lines
    if (!collectingLimits) {
      const formattedLine = formatLogLine(content, originalIndex, lines);
      if (formattedLine) {
        formattedLines.push({
          ...formattedLine,
          type: formattedLine.type,
          originalIndex
        });
      }
    }

    // Handle limits collection
    if (content.includes('CUMULATIVE_LIMIT_USAGE') && !content.includes('CUMULATIVE_LIMIT_USAGE_END')) {
      collectingLimits = true;
      continue;
    }

    if (content.includes('CUMULATIVE_LIMIT_USAGE_END')) {
      const metrics = [];
      metrics.push('Limits');
      
      if (limitData['Number of SOQL queries']?.used > 0 || limitData['Number of query rows']?.used > 0) {
        metrics.push(`🔍 SOQL: ${limitData['Number of SOQL queries'].used}/${limitData['Number of SOQL queries'].total} Queries, ${limitData['Number of query rows'].used}/${limitData['Number of query rows'].total} Rows`);
      }
      
      if (limitData['Number of DML statements']?.used > 0 || limitData['Number of DML rows']?.used > 0) {
        metrics.push(`🔶 DML: ${limitData['Number of DML statements'].used}/${limitData['Number of DML statements'].total} Statements, ${limitData['Number of DML rows'].used}/${limitData['Number of DML rows'].total} Rows`);
      }
      
      if (limitData['Maximum CPU time']?.used > 0) {
        const heapUsedKB = Math.round(limitData['Maximum heap size'].used / 1024);
        const heapTotalKB = Math.round(limitData['Maximum heap size'].total / 1024);
        metrics.push(`💻 CPU: ${limitData['Maximum CPU time'].used}ms, Heap: ${heapUsedKB}/${heapTotalKB}KB`);
      }

      if (metrics.length > 0) {
        formattedLines.push({
          id: `line_${originalIndex}`,
          time: currentTime,
          summary: metrics.join(' | '),
          type: 'LIMITS',
          isCollapsible: false,
          originalIndex
        });
      }
      
      collectingLimits = false;
      limitData = {};
      continue;
    }

    if (collectingLimits) {
      const metricMatch = content.match(/^(.*?):\s*(\d+)\s*out of\s*(\d+)/);
      if (metricMatch) {
        const [_, name, used, total] = metricMatch;
        limitData[name.trim()] = {
          used: parseInt(used),
          total: parseInt(total)
        };
      }
    }
  }

  return formattedLines;
} 