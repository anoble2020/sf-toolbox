interface LimitUsage {
  namespace: string;
  metrics: {
    [key: string]: {
      used: number;
      total: number;
    };
  };
}

function tryFormatJson(str: string): string {
  try {
    // Remove any leading timestamps or debug markers
    const jsonStart = str.indexOf('[') || str.indexOf('{');
    if (jsonStart === -1) return str;
    
    const jsonStr = str.slice(jsonStart);
    const parsed = JSON.parse(jsonStr);
    const formatted = JSON.stringify(parsed, null, 2);
    
    // Preserve any prefix before the JSON
    const prefix = str.slice(0, jsonStart);
    return prefix + '\n' + formatted;
  } catch (e) {
    return str;
  }
}

export function formatLogLine(line: string): string {
  // Handle debug level configuration line
  if (line.includes('APEX_CODE,')) {
    return '🔧 Debug Levels: ' + line.split(' ')[1];
  }

  // Extract timestamp and remove the milliseconds number
  const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})\.(\d+)\s*\(\d+\)\|/);
  if (!timeMatch) return line;

  const [fullMatch, time] = timeMatch;
  let cleanLine = line.replace(fullMatch, `${time} `);

  // Format SOQL queries
  if (cleanLine.includes('SOQL_EXECUTE_BEGIN')) {
    const parts = cleanLine.split('|');
    const lineNumber = parts[1]?.match(/\[(\d+)\]/)?.[1];
    const query = parts[2];
    return `${time} 🔍 SQL Query [Line ${lineNumber}]: ${query?.trim()}`;
  }

  if (cleanLine.includes('SOQL_EXECUTE_END')) {
    const rows = cleanLine.match(/Rows:(\d+)/);
    const lineNumber = cleanLine.split('|')[1]?.match(/\[(\d+)\]/)?.[1];
    return `${time} ✓ Query completed [Line ${lineNumber}]: ${rows ? rows[1] : '0'} rows`;
  }

  // Format USER_DEBUG with potential JSON content
  if (cleanLine.includes('USER_DEBUG')) {
    const debugMatch = cleanLine.match(/USER_DEBUG\|\[(\d+)\]\|(DEBUG|INFO|WARN|ERROR)\|(.*)/);
    if (debugMatch) {
      const [_, line, level, message] = debugMatch;
      const emoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '🔍';
      const formattedMessage = tryFormatJson(message);
      return `${time} ${emoji} Debug [Line ${line}]: ${formattedMessage}`;
    }
  }

  // Format CODE_UNIT events
  if (cleanLine.includes('CODE_UNIT_STARTED')) {
    const parts = cleanLine.split('|');
    const unitType = parts[3] === '[EXTERNAL]' ? parts[5] : parts[3];
    const details = parts[4];
    return `${time} ▶️ Started ${unitType}: ${details}`;
  }

  if (cleanLine.includes('CODE_UNIT_FINISHED')) {
    const parts = cleanLine.split('|');
    const unitType = parts[3] === '[EXTERNAL]' ? parts[5] : parts[3];
    const details = parts[4];
    return `${time} ⏹️ Finished ${unitType}: ${details}`;
  }

  // Format DML operations
  if (cleanLine.includes('DML_BEGIN')) {
    const operation = cleanLine.match(/DML_BEGIN\|.*\|(INSERT|UPDATE|DELETE|UPSERT|MERGE)/)?.[1];
    const numRecords = cleanLine.match(/\[(\d+)\]/)?.[1];
    return `${time} 💾 ${operation} Operation: ${numRecords} records`;
  }

  if (cleanLine.includes('DML_END')) {
    return `${time} ✓ DML Operation completed`;
  }

  // Format Flow events
  if (cleanLine.includes('FLOW_')) {
    const flowMatch = cleanLine.match(/FLOW_(START|FINISH|CREATE_INTERVIEW|ELEMENT_.*)/);
    if (flowMatch) {
      const [action] = flowMatch;
      const flowName = cleanLine.split('|').pop();
      const emoji = action.includes('START') ? '🌊' : action.includes('FINISH') ? '🏁' : '⚡';
      return `${time} ${emoji} Flow ${action.toLowerCase()}: ${flowName}`;
    }
  }

  return cleanLine;
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

export function formatLogs(lines: string[]): string[] {
  const limitFormatted = formatLimitUsage(lines);
  return limitFormatted.map(line => formatLogLine(line));
} 