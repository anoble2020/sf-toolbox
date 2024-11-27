import { withApiLimits } from './apiMiddleware'

export async function salesforceApi(url: string, options: RequestInit): Promise<Response> {
    return withApiLimits(url, options)
}
