import { refreshAccessToken } from './auth'
import { useApiLimits } from './store'

interface SalesforceResponse<T> {
  records: T[]
  totalSize: number
  done: boolean
}

interface ApexLog {
  Id: string
  LogUser: {
    Name: string
  }
  Operation: string
  Request: string
  Status: string
  LogLength: number
  LastModifiedDate: string
  DurationMilliseconds: number
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
    useApiLimits.getState().updateLimits(Number(used), Number(total))
  } else {
    console.log('Could not parse limit info:', limitInfo)
  }
}

export const queryLogs = async (): Promise<ApexLog[]> => {
  const refreshToken = localStorage.getItem('sf_refresh_token')
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  try {
    console.log('Getting fresh access token...')
    const { access_token, instance_url } = await refreshAccessToken(refreshToken)
    console.log('Got access token, fetching logs...')

    const response = await fetch(
      `/api/salesforce/logs?instance_url=${encodeURIComponent(instance_url)}`,
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