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
}

function updateApiLimitsFromHeaders(headers: Headers) {
  const limitInfo = headers.get('X-Salesforce-Limits')
  if (!limitInfo) {
    console.log('No limit info in headers:', Object.fromEntries(headers.entries()))
    return
  }

  const match = limitInfo.match(/api-usage=(\d+)\/(\d+)/)
  if (match) {
    const [, used, total] = match
    useApiLimits.getState().updateLimits(parseInt(used), parseInt(total))
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

    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    updateApiLimitsFromHeaders(response.headers)

    const data = await response.json()
    console.log('Logs response:', {
      ok: response.ok,
      status: response.status,
      recordCount: data.records?.length,
      error: data.error
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${data.error}`)
    }

    return data.records
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

  if (!response.ok) {
    throw new Error('Failed to fetch log body')
  }

  return response.text()
} 