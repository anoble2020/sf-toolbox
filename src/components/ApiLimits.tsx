import { useApiLimits } from '@/lib/store'
import { CircleDashed } from 'lucide-react'

export function ApiLimits() {
  const { limits } = useApiLimits()
    
  if (!limits.used && !limits.total) {
    return null
  }
  
  const usagePercent = (limits.used / limits.total) * 100
  const isHighUsage = usagePercent > 80

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-gray-500 mb-1">API Calls</span>
      <div className="flex items-center gap-2">
        <CircleDashed className="w-4 h-4 text-gray-500" />
        <span className={`font-medium ${isHighUsage ? 'text-red-500' : 'text-gray-600'}`}>
          {limits.used.toLocaleString()} / {limits.total.toLocaleString()}
        </span>
      </div>
    </div>
  )
} 