import { updateApiLimitsFromHeaders } from './salesforce'

export async function withApiLimits(
  url: string,
  options: RequestInit
): Promise<Response> {
  const response = await fetch(url, options)
  
  // Process API limits from headers
  updateApiLimitsFromHeaders(response.headers)
  
  return response
} 