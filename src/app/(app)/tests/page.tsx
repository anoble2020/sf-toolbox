'use client'

import { useState, useEffect } from 'react'
import { refreshAccessToken } from '@/lib/auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Play, Loader2 } from "lucide-react"
import { SelectTestMethodsModal } from '@/components/SelectTestMethodsModal'
import { TestResultsTable } from '@/components/TestResultsTable'
import { toast } from 'sonner'

interface TestClass {
  Id: string
  Name: string
  testMethods: string[]
}

interface TestRun {
  classId: string
  testRunId: string
  status: 'running' | 'completed'
  results?: any[]
  coverage?: any[]
  jobInfo?: any
  error?: string
}

export default function TestsPage() {
  const [testClasses, setTestClasses] = useState<TestClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<TestClass | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())
  const [testRuns, setTestRuns] = useState<TestRun[]>([])

  const fetchTestClasses = async () => {
    try {
      const refreshToken = localStorage.getItem('sf_refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token found')
      }

      const { access_token, instance_url } = await refreshAccessToken(refreshToken)

      const response = await fetch(
        `/api/salesforce/tests/classes?instance_url=${encodeURIComponent(instance_url)}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch test classes')
      }

      const data = await response.json()
      setTestClasses(data)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestClasses()
  }, [])

  const runTests = async (classId: string, methodNames: string[]) => {
    if (!classId || !methodNames.length) {
      toast.error('Invalid test parameters')
      return
    }

    try {
      const refreshToken = localStorage.getItem('sf_refresh_token')
      if (!refreshToken) {
        toast.error('Not authenticated')
        return
      }

      // Set running state first
      setRunningTests(prev => new Set(prev).add(classId))

      // Get access token
      const authResult = await refreshAccessToken(refreshToken)
      console.log('Auth result:', { authResult })

      const response = await fetch(
        `/api/salesforce/tests/run?instance_url=${encodeURIComponent(authResult.instance_url)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authResult.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            classId, 
            methodNames 
          })
        }
      )

      console.log('Test run response status:', response.status)
      const responseData = await response.json()
      console.log('Test run response data:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to start test run')
      }

      if (!responseData.testRunId) {
        throw new Error('No test run ID returned')
      }

      // Add new test run to state
      const newRun = {
        classId,
        testRunId: responseData.testRunId,
        status: 'running' as const
      }

      setTestRuns(prev => [...prev, newRun])

      // Start polling
      pollTestResults(
        responseData.testRunId,
        authResult.instance_url,
        authResult.access_token
      )

    } catch (error) {
      console.error('Error in runTests:', error)
      
      // Clean up running state
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(classId)
        return newSet
      })

      // Show error to user
      toast.error(error instanceof Error ? error.message : 'Failed to run tests')
    }
  }

  const pollTestResults = async (testRunId: string, instance_url: string, access_token: string) => {
    if (!testRunId || !instance_url || !access_token) {
      console.error('Missing parameters:', { testRunId, instance_url, access_token })
      return
    }

    try {
      const response = await fetch(
        `/api/salesforce/tests/results/${testRunId}?instance_url=${encodeURIComponent(instance_url)}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Poll response:', data)

      if (data.error) {
        throw new Error(data.error)
      }

      setTestRuns(prev => prev.map(run => {
        if (run.testRunId === testRunId) {
          if (data.isComplete) {
            // Remove from running tests when complete
            setRunningTests(current => {
              const newSet = new Set(current)
              newSet.delete(run.classId)
              return newSet
            })
            
            // Always update with completed status and available data
            return {
              ...run,
              status: 'completed',
              results: data.results,
              coverage: data.coverage,
              jobInfo: data.jobInfo
            }
          }
          // Update progress info if not complete
          return {
            ...run,
            jobInfo: data.jobInfo
          }
        }
        return run
      }))

      if (!data.isComplete) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        await pollTestResults(testRunId, instance_url, access_token)
      } else {
        // Show completion toast
        const passCount = data.results?.filter((r: any) => r.Outcome === 'Pass').length || 0
        const totalCount = data.results?.length || 0
        toast.success(`Test run completed: ${passCount}/${totalCount} tests passed`)
      }
    } catch (error) {
      console.error('Error polling test results:', error)
      
      setTestRuns(prev => prev.map(run => {
        if (run.testRunId === testRunId) {
          setRunningTests(current => {
            const newSet = new Set(current)
            newSet.delete(run.classId)
            return newSet
          })
          
          return {
            ...run,
            status: 'completed',
            error: error instanceof Error ? error.message : 'An error occurred'
          }
        }
        return run
      }))

      toast.error('Failed to get test results')
    }
  }

  if (loading) {
    return (
      <div className="text-center justify-center mt-16">
      <h2 className="text-xl font-medium mb-4">Retrieving Test Classes...</h2>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
    </div>
    )
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="p-4 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Test Classes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Name</TableHead>
              <TableHead>Methods</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testClasses.map((testClass) => (
              <TableRow key={testClass.Id}>
                <TableCell>{testClass.Name}</TableCell>
                <TableCell>{testClass.testMethods.length} test methods</TableCell>
                <TableCell>
                  {runningTests.has(testClass.Id) ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-500">Running...</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClass(testClass)
                        setIsModalOpen(true)
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Tests
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {testRuns.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <TestResultsTable runs={testRuns} testClasses={testClasses} />
        </div>
      )}

      {selectedClass && (
        <SelectTestMethodsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          testClass={selectedClass}
          onRunTests={(methodNames) => {
            runTests(selectedClass.Id, methodNames)
            setIsModalOpen(false)
          }}
        />
      )}
    </div>
  )
} 