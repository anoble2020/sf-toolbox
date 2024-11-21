'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import { CodeEditor } from '@/components/CodeEditor'
import { refreshAccessToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function ExecutePage() {
  const [code, setCode] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const router = useRouter()

  const executeCode = async (codeToExecute: string) => {
    const refreshToken = localStorage.getItem('sf_refresh_token')
    if (!refreshToken) {
      toast.error('Not authenticated')
      return
    }

    try {
      setIsExecuting(true)
      const { access_token, instance_url } = await refreshAccessToken(refreshToken)

      const response = await fetch(`/api/salesforce/execute?instance_url=${encodeURIComponent(instance_url)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: codeToExecute })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to execute code')
      }

      console.log('resulting log:', result);

      // Store the log ID for automatic selection
      if (result.logId) {
        localStorage.setItem('pending_log_selection', result.logId)
        
        // Check the execution status
        if (result.logStatus === 'Success') {
          toast.success('Code executed successfully', {
            action: {
              label: 'View Log',
              onClick: () => router.push('/logs')
            }
          })
        } else {
          // For non-success statuses, show as error with the status message
          toast.error(result.logStatus || 'Execution failed', {
            action: {
              label: 'View Log',
              onClick: () => router.push('/logs')
            }
          })
        }
      } else {
        toast.error(result.exceptionMessage || result.compileProblem || 'Failed to execute code')
      }

    } catch (error) {
      console.error('Execute error:', error)
      toast.error(error.message)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleExecute = () => {
    executeCode(code)
  }

  const handleExecuteHighlighted = () => {
    // CodeMirror will provide the selected text through our CodeEditor component
    const selection = window.getSelection()?.toString()
    if (!selection) {
      toast.error('No code selected')
      return
    }
    executeCode(selection)
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex-1">
        <CodeEditor
          value={code}
          onChange={setCode}
          language="apex"
        />
      </div>
      <div className="flex gap-2 mt-4">
        <Button 
          onClick={handleExecute}
          disabled={isExecuting}
        >
          Execute
        </Button>
        <Button
          onClick={handleExecuteHighlighted}
          disabled={isExecuting}
          variant="outline"
        >
          Execute Highlighted
        </Button>
      </div>
    </div>
  )
} 