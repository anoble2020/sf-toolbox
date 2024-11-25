"use client"

import { useApiLimits } from '@/lib/store'
import { CircleDashed } from 'lucide-react'
import { useEffect } from 'react'

export function ApiLimits() {
  // Subscribe to specific slice of the store
  const limits = useApiLimits((state) => state.limits)
  
  useEffect(() => {
    console.log('ApiLimits limits changed:', limits)
  }, [limits])
  
  if (!limits.used && !limits.total) {
    console.log('ApiLimits rendering null - no limits')
    return null
  }
  
  console.log('ApiLimits rendering with limits:', limits)
  
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