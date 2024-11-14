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
  type: 'SOQL' | 'JSON' | 'STANDARD';
  isCollapsible?: boolean;
  suffix?: string;
}

function tryFormatJson(str: string): { formatted: string; isJson: boolean } {
  try {
    const jsonStart = str.indexOf('[') || str.indexOf('{');
    if (jsonStart === -1) return { formatted: str, isJson: false };
    
    const jsonStr = str.slice(jsonStart);
    const parsed = JSON.parse(jsonStr);
    const formatted = JSON.stringify(parsed, null, 2);
    
    return { 
      formatted,
      isJson: true 
    };
  } catch (e) {
    return { formatted: str, isJson: false };
  }
}

export function formatLogLine(line: string, index: number, allLines: string[]): FormattedLine {
  const baseId = `line_${index}_${Date.now()}`; // Make IDs unique
  
  // Handle debug level configuration line
  if (line.includes('APEX_CODE,')) {
    return {
      id: baseId,
      time: '',
      summary: '🔧 Debug Levels: ' + line.split(' ')[1],
      type: 'STANDARD'
    };
  }

  // Extract timestamp
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
  let cleanLine = line.replace(fullMatch, '');

  // Format SOQL queries - only process SOQL_EXECUTE_BEGIN lines
  if (cleanLine.includes('SOQL_EXECUTE_BEGIN')) {
    const parts = cleanLine.split('|');
    const lineNumber = parts[1]?.match(/\[(\d+)\]/)?.[1] || '';
    const query = parts.slice(3).join('|').trim();
    
    // Look ahead for the corresponding END line to get row count
    const nextLine = allLines[index + 1];
    const rowCount = nextLine?.match(/Rows:(\d+)/)?.[1] || '0';
    
    return {
      id: baseId,
      time,
      summary: `🔍 SOQL [${lineNumber}]: ${query} `,
      type: 'STANDARD',
      suffix: `(${rowCount} rows)`
    };
  }

  // Skip SOQL_EXECUTE_END lines
  if (cleanLine.includes('SOQL_EXECUTE_END')) {
    return null;
  }

  // Format USER_DEBUG with JSON detection
  if (cleanLine.includes('USER_DEBUG')) {
    const debugMatch = cleanLine.match(/USER_DEBUG\|\[(\d+)\]\|(DEBUG|INFO|WARN|ERROR)\|(.*)/);
    if (debugMatch) {
      const [_, lineNum, level, message] = debugMatch;
      const { formatted, isJson } = tryFormatJson(message);
      const emoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '🔍';
      
      return {
        id: baseId,
        time,
        summary: `${emoji} Debug [Line ${lineNum}]${isJson ? ' (JSON)' : ''}`,
        details: isJson ? formatted : message,
        type: isJson ? 'JSON' : 'STANDARD',
        isCollapsible: isJson
      };
    }
  }

  // Format CODE_UNIT events
  if (cleanLine.includes('CODE_UNIT_STARTED')) {
    const parts = cleanLine.split('|');
    const isExternal = parts[3] === '[EXTERNAL]';
    const triggerMatch = parts[parts.length - 1]?.match(/__sfdc_trigger\/(.*)/);
    
    let unitType = isExternal ? parts[5] : parts[3];
    let details = parts[4];

    if (triggerMatch) {
      unitType = 'Trigger';
      details = triggerMatch[1];
    }

    return {
      id: baseId,
      time,
      summary: `${time} ▶️ Started ${unitType}: ${details}`,
      type: 'STANDARD'
    };
  }

  // ... rest of the formatting logic ...

  return {
    id: baseId,
    time,
    summary: cleanLine,
    type: 'STANDARD'
  };
}

export function formatLimitUsage(lines: string[]): string[] {
  const formattedLines: string[] = [];
  let currentLimits: LimitUsage[] = [];
  let collectingLimits = false;

  for (const line of lines) {
    if (line.includes('CUMULATIVE_LIMIT_USAGE')) {
      collectingLimits = true;
      continue;
    }

    if (line.includes('CUMULATIVE_LIMIT_USAGE_END')) {
      // Format and add the collected limits
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
      const time = timeMatch ? timeMatch[1] : '';
      
      formattedLines.push(`${time} 📊 Resource Usage:`);
      for (const usage of currentLimits) {
        formattedLines.push(`   ${usage.namespace === '(default)' ? 'Default' : usage.namespace} Namespace:`);
        for (const [metric, values] of Object.entries(usage.metrics)) {
          if (values.used > 0) {
            formattedLines.push(`     • ${metric}: ${values.used}/${values.total}`);
          }
        }
      }

      collectingLimits = false;
      currentLimits = [];
      continue;
    }

    if (collectingLimits) {
      // Parse limit usage lines
      const namespaceMatch = line.match(/LIMIT_USAGE_FOR_NS\|(.*)\|/);
      if (namespaceMatch) {
        const namespace = namespaceMatch[1];
        const metrics: { [key: string]: { used: number; total: number } } = {};
        
        // Parse each metric line
        const metricsText = line.split('|').slice(2).join('');
        const metricLines = metricsText.trim().split('\n');
        
        metricLines.forEach(metricLine => {
          const match = metricLine.match(/(.*?):\s*(\d+)\s*out of\s*(\d+)/);
          if (match) {
            const [_, name, used, total] = match;
            metrics[name.trim()] = {
              used: parseInt(used),
              total: parseInt(total)
            };
          }
        });

        currentLimits.push({ namespace, metrics });
      }
      continue;
    }

    formattedLines.push(line);
  }

  return formattedLines;
}

export function formatLogs(lines: string[]): FormattedLine[] {
  const limitFormatted = formatLimitUsage(lines);
  return limitFormatted
    .map((line, index) => formatLogLine(line, index, limitFormatted))
    .filter((line): line is FormattedLine => line !== null);
} 