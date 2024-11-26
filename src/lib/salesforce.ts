import { refreshAccessToken } from './auth'
import { apiLimitsActions } from './store'

interface SalesforceResponse<T> {
  records: T[]
  totalSize: number
  done: boolean
}

interface ApexLog {
  Id: string
  LogUser: {
    Id: string
    Name: string
  }
  Operation: string
  Request: string
  Status: string
  LogLength: number
  LastModifiedDate: string
  DurationMilliseconds: number
}

interface DebugLevel {
  Id: string
  DeveloperName: string
}

interface TraceFlag {
  Id: string
  LogType: string
  StartDate: string
  ExpirationDate: string
  DebugLevelId: string
  TracedEntityId: string
}

export function updateApiLimitsFromHeaders(headers: Headers) {
  console.log('Processing headers:', Object.fromEntries(headers.entries()))
  
  // Try different possible header names
  const limitInfo = 
    headers.get('Sforce-Limit-Info') || 
    headers.get('X-Sfdc-Api-Limit') ||
    headers.get('x-salesforce-limits')
  
  if (!limitInfo) {
    console.log('No API limit headers found')
    return
  }

  console.log('Found limit info:', limitInfo)
  
  // Try different formats
  const match = 
    limitInfo.match(/api-usage=(\d+)\/(\d+)/) || 
    limitInfo.match(/(\d+)\/(\d+)/)
    
  if (match) {
    const [, used, total] = match
    console.log('Parsed limits:', { used, total })
    apiLimitsActions.updateLimits(Number(used), Number(total))
  } else {
    console.log('Could not parse limit info:', limitInfo)
  }
}

export const queryLogs = async (currentUserOnly = false): Promise<ApexLog[]> => {
  const refreshToken = localStorage.getItem('sf_refresh_token')
  const userInfo = JSON.parse(localStorage.getItem('sf_user_info') || '{}')
  
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  try {
    console.log('Getting fresh access token...')
    const { access_token, instance_url } = await refreshAccessToken(refreshToken)
    console.log('Got access token, fetching logs...')

    const query = 'SELECT Id, LogUser.Id, LogUser.Name, Operation, Request, Status, LogLength, LastModifiedDate, DurationMilliseconds FROM ApexLog ORDER BY LastModifiedDate DESC LIMIT 100'

    const response = await fetch(
      `/api/salesforce/logs?instance_url=${encodeURIComponent(instance_url)}&query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    updateApiLimitsFromHeaders(response.headers)

    const data = await response.json()
    console.log('Raw logs response:', data)

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${data.error}`)
    }

    if (!data.records || !Array.isArray(data.records)) {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format from Salesforce API')
    }

    return data.records.map((record: ApexLog) => {
      if (!record.Id) {
        console.warn('Log record missing ID:', record)
        return null
      }
      return {
        Id: record.Id,
        LogUser: {
          Id: record.LogUser?.Id || '',
          Name: record.LogUser?.Name || 'Unknown'
        },
        Operation: record.Operation || '',
        LastModifiedDate: record.LastModifiedDate || '',
        DurationMilliseconds: record.DurationMilliseconds || 0,
        Status: record.Status || '',
        LogLength: record.LogLength || 0,
        Request: record.Request || ''
      }
    }).filter(Boolean)
  } catch (error) {
    console.error('Error in queryLogs:', error)
    throw error
  }
}

export const getLogBody = async (logId: string): Promise<string> => {
  const refreshToken = localStorage.getItem('sf_refresh_token')
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  const { access_token, instance_url } = await refreshAccessToken(refreshToken)

  const response = await fetch(
    `/api/salesforce/logs/${logId}/body?instance_url=${encodeURIComponent(instance_url)}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  )

  updateApiLimitsFromHeaders(response.headers)

  if (!response.ok) {
    throw new Error('Failed to fetch log body')
  }

  return response.text()
}

export const createTraceFlag = async (userId: string, debugLevelId: string, logType: string): Promise<void> => {
  const refreshToken = localStorage.getItem('sf_refresh_token')
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  try {
    const { access_token, instance_url } = await refreshAccessToken(refreshToken)

    // First check for existing trace flags
    const query = `
      SELECT Id, ExpirationDate 
      FROM TraceFlag 
      WHERE TracedEntityId = '${userId}' 
      AND ExpirationDate > ${new Date().toISOString()}
      LIMIT 1
    `

    const existingFlagsResponse = await fetch(
      `/api/salesforce/tooling/query?q=${encodeURIComponent(query)}&instance_url=${encodeURIComponent(instance_url)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const existingFlags = await existingFlagsResponse.json()

    // If active trace flag exists, return early
    if (existingFlags.records && existingFlags.records.length > 0) {
      console.log('Active trace flag already exists:', existingFlags.records[0])
      return
    }

    let queriedDebugLevelId;
    if(!debugLevelId) {
        // First, get the SFDC_DevConsole debug level ID using Tooling API
        const debugLevelResponse = await fetch(
        `/api/salesforce/tooling/query?q=${encodeURIComponent(
            "SELECT Id FROM DebugLevel WHERE DeveloperName = 'SFDC_DevConsole'"
        )}&instance_url=${encodeURIComponent(instance_url)}`,
        {
            headers: {
            Authorization: `Bearer ${access_token}`,
            },
        }
        )

        console.log('Debug level response:', debugLevelResponse)

        if (!debugLevelResponse.ok) {
        const errorData = await debugLevelResponse.json()
        console.error('Debug level fetch failed:', {
            status: debugLevelResponse.status,
            statusText: debugLevelResponse.statusText,
            error: errorData
        })
        throw new Error(`Failed to fetch debug level: ${debugLevelResponse.statusText}`)
        }

        const debugLevelData = await debugLevelResponse.json()
        if (!debugLevelData.records?.[0]?.Id) {
        throw new Error('Debug level not found')
        }

        queriedDebugLevelId = debugLevelData.records[0].Id
        console.log('Debug level ID:', debugLevelId)
    }

    // Calculate dates for the trace flag
    const now = new Date()
    const expiration = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now

    const requestBody = {
        LogType: logType ? logType : 'DEVELOPER_LOG',
        StartDate: now.toISOString(),
        ExpirationDate: expiration.toISOString(),
        DebugLevelId: debugLevelId ? debugLevelId : queriedDebugLevelId,
        TracedEntityId: userId,
    }

    console.log('Creating trace flag with request body:', requestBody)
    console.log('Creating trace flag with instance_url:', instance_url)

    // Create the trace flag
    const response = await fetch(
      `/api/salesforce/traceflags?instance_url=${encodeURIComponent(instance_url)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    )

    updateApiLimitsFromHeaders(response.headers)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Failed to create trace flag:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Failed to create trace flag: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Trace flag created successfully:', data)

  } catch (error) {
    console.error('Error creating trace flag:', error)
    throw error
  }
}

export interface TraceFlag {
  Id: string;
  LogType?: string;
  StartDate?: string;
  ExpirationDate: string;
  DebugLevelId?: string;
  TracedEntityId: string;
  TracedEntity: {
    Name: string;
  };
  DebugLevel: {
    Name: string;
  };
}

export const queryTraceFlags = async (): Promise<TraceFlag[]> => {
  const refreshToken = localStorage.getItem('sf_refresh_token')
  
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  try {
    const { access_token, instance_url } = await refreshAccessToken(refreshToken)

    const query = `
      SELECT Id, TracedEntity.Name, DebugLevel.MasterLabel, ExpirationDate 
      FROM TraceFlag 
      ORDER BY ExpirationDate DESC
    `
    
    console.log('Querying trace flags with:', {
      query,
      instance_url
    })

    const response = await fetch(
      `/api/salesforce/tooling/query?q=${encodeURIComponent(query)}&instance_url=${encodeURIComponent(instance_url)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    updateApiLimitsFromHeaders(response.headers)

    const data = await response.json()
    console.log('Trace flags response:', data)

    if (!response.ok) {
      throw new Error(`Failed to fetch trace flags: ${data.error}`)
    }

    if (!data.records) {
      console.warn('No records found in response:', data)
      return []
    }

    return data.records || []
  } catch (error) {
    console.error('Error in queryTraceFlags:', error)
    throw error
  }
}

export const renewTraceFlag = async (traceFlagId: string): Promise<void> => {
  console.log('Renewing trace flag with id:', traceFlagId)
  const refreshToken = localStorage.getItem('sf_refresh_token')
  
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  try {
    const { access_token, instance_url } = await refreshAccessToken(refreshToken)
    
    // Calculate new expiration date (8 hours from now)
    const expirationDate = new Date()
    expirationDate.setHours(expirationDate.getHours() + 8)

    console.log('Renewing trace flag with expiration date:', expirationDate.toISOString())

    const response = await fetch(
      `/api/salesforce/traceflags/${traceFlagId}?instance_url=${encodeURIComponent(instance_url)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ExpirationDate: expirationDate.toISOString()
        })
      }
    )

    console.log('Renewing trace flag response:', response)

    updateApiLimitsFromHeaders(response.headers)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to renew trace flag: ${error.message || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Error in renewTraceFlag:', error)
    throw error
  }
}

export const deleteTraceFlag = async (traceFlagId: string): Promise<void> => {
  const refreshToken = localStorage.getItem('sf_refresh_token')
  
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  try {
    const { access_token, instance_url } = await refreshAccessToken(refreshToken)

    const response = await fetch(
      `/api/salesforce/traceflags/${traceFlagId}?instance_url=${encodeURIComponent(instance_url)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
        }
      }
    )

    updateApiLimitsFromHeaders(response.headers)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to delete trace flag: ${error.message || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Error in deleteTraceFlag:', error)
    throw error
  }
}

export interface SalesforceUser {
  Id: string;
  Name: string;
  Username: string;
}

export interface DebugLevel {
  Id: string;
  MasterLabel: string;
}

export const queryUsers = async (): Promise<SalesforceUser[]> => {
  const refreshToken = localStorage.getItem('sf_refresh_token')
  
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  try {
    const { access_token, instance_url } = await refreshAccessToken(refreshToken)

    const query = `
      SELECT Id, Name, Username, IsActive
      FROM User 
      WHERE IsActive = true 
      ORDER BY Name
    `

    const response = await fetch(
      `/api/salesforce/query?q=${encodeURIComponent(query)}&instance_url=${encodeURIComponent(instance_url)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    updateApiLimitsFromHeaders(response.headers)

    const data = await response.json()
    return data.records || []
  } catch (error) {
    console.error('Error querying users:', error)
    throw error
  }
}

export const queryDebugLevels = async (): Promise<DebugLevel[]> => {
  const refreshToken = localStorage.getItem('sf_refresh_token')
  
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  try {
    const { access_token, instance_url } = await refreshAccessToken(refreshToken)

    const query = `
      SELECT Id, MasterLabel 
      FROM DebugLevel 
      ORDER BY MasterLabel
    `

    const response = await fetch(
      `/api/salesforce/tooling/query?q=${encodeURIComponent(query)}&instance_url=${encodeURIComponent(instance_url)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    updateApiLimitsFromHeaders(response.headers)

    const data = await response.json()
    return data.records || []
  } catch (error) {
    console.error('Error querying debug levels:', error)
    throw error
  }
} 