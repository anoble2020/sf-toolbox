import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.log('No auth header provided')
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const instanceUrl = searchParams.get('instance_url')
    
    console.log('Fetching user info...')
    // First get the user info
    const userInfoResponse = await fetch(
      `${instanceUrl}/services/oauth2/userinfo`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    )

    const userInfo = await userInfoResponse.json()
    //console.log('User info:', userInfo)

    // Then fetch logs for this user
    const query = encodeURIComponent(
      `SELECT Id, LogUser.Name, LogUser.Id, Operation, Request, Status, LogLength, LastModifiedDate, DurationMilliseconds 
       FROM ApexLog
       ORDER BY LastModifiedDate DESC 
       LIMIT 100`
    )

    console.log('Fetching logs with query:', decodeURIComponent(query))

    const sfResponse = await fetch(
      `${instanceUrl}/services/data/v59.0/tooling/query?q=${query}`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    )

    const data = await sfResponse.json()
    
    // Get the limit info from Salesforce response
    const limitInfo = sfResponse.headers.get('Sforce-Limit-Info')
    
    // Create response with the data and forward the limit header
    const response = NextResponse.json(data)
    if (limitInfo) {
      response.headers.set('X-Salesforce-Limits', limitInfo)
    }

    return response
  } catch (error) {
    console.error('Logs fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 