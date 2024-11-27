'use client'

import { useState, useEffect } from 'react'
import { refreshAccessToken } from '@/lib/auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Play, Loader2, Search, ChevronLeft, ChevronRight, Trash2, LineChart, BarChart2 } from 'lucide-react'
import { SelectTestMethodsModal } from '@/components/SelectTestMethodsModal'
import { TestResultsTable } from '@/components/TestResultsTable'
import { CoverageSheet } from '@/components/CoverageSheet'
import { toast } from 'sonner'
import { CACHE_DURATIONS } from '@/lib/constants'

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
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [isCoverageOpen, setIsCoverageOpen] = useState(false)

    const fetchTestClasses = async () => {
        try {
            const cachedData = localStorage.getItem('cached_test_classes')
            if (cachedData) {
                const parsed = JSON.parse(cachedData)
                if (Date.now() - parsed.lastFetched < CACHE_DURATIONS.LONG) {
                    setTestClasses(parsed.classes)
                    setLoading(false)
                    return
                }
            }

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
                },
            )

            if (!response.ok) {
                throw new Error('Failed to fetch test classes')
            }

            const data = await response.json()
            setTestClasses(data)

            const cacheData = {
                classes: data,
                lastFetched: Date.now(),
            }
            localStorage.setItem('cached_test_classes', JSON.stringify(cacheData))
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
            setRunningTests((prev) => new Set(prev).add(classId))

            // Get access token
            const authResult = await refreshAccessToken(refreshToken)
            console.log('Auth result:', { authResult })

            const response = await fetch(
                `/api/salesforce/tests/run?instance_url=${encodeURIComponent(authResult.instance_url)}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${authResult.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        classId,
                        methodNames,
                    }),
                },
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
                status: 'running' as const,
            }

            setTestRuns((prev) => [...prev, newRun])

            // Start polling
            pollTestResults(responseData.testRunId, authResult.instance_url, authResult.access_token)
        } catch (error) {
            console.error('Error in runTests:', error)

            // Clean up running state
            setRunningTests((prev) => {
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
            console.error('Missing parameters:', {
                testRunId,
                instance_url,
                access_token,
            })
            return
        }

        try {
            const response = await fetch(
                `/api/salesforce/tests/results/${testRunId}?instance_url=${encodeURIComponent(instance_url)}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                },
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

            setTestRuns((prev) =>
                prev.map((run) => {
                    if (run.testRunId === testRunId) {
                        if (data.isComplete) {
                            // Remove from running tests when complete
                            setRunningTests((current) => {
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
                                jobInfo: data.jobInfo,
                            }
                        }
                        // Update progress info if not complete
                        return {
                            ...run,
                            jobInfo: data.jobInfo,
                        }
                    }
                    return run
                }),
            )

            if (!data.isComplete) {
                await new Promise((resolve) => setTimeout(resolve, 5000))
                await pollTestResults(testRunId, instance_url, access_token)
            } else {
                // Show completion toast
                const passCount = data.results?.filter((r: any) => r.Outcome === 'Pass').length || 0
                const totalCount = data.results?.length || 0
                toast.success(`Test run completed: ${passCount}/${totalCount} tests passed`)
            }
        } catch (error) {
            console.error('Error polling test results:', error)

            setTestRuns((prev) =>
                prev.map((run) => {
                    if (run.testRunId === testRunId) {
                        setRunningTests((current) => {
                            const newSet = new Set(current)
                            newSet.delete(run.classId)
                            return newSet
                        })

                        return {
                            ...run,
                            status: 'completed',
                            error: error instanceof Error ? error.message : 'An error occurred',
                        }
                    }
                    return run
                }),
            )

            toast.error('Failed to get test results')
        }
    }

    // Filter test classes based on search
    const filteredClasses = testClasses.filter((testClass) =>
        testClass.Name.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Calculate total pages
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)

    // Get current page's classes
    const paginatedClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    // Clear test results
    const clearTestResults = () => {
        setTestRuns([])
        toast.success('Test results cleared')
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
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-4">
            {/* Test Classes Section - Top Half */}
            <div className="h-1/2 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Test Classes</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsCoverageOpen(true)}>
                            <BarChart2 className="h-4 w-4 mr-2" />
                            View Coverage
                        </Button>

                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search classes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 w-[250px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Class Name</TableHead>
                                <TableHead>Methods</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedClasses.map((testClass) => (
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

                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-2 border-t">
                    <div className="text-xs text-gray-500">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Test Results Section - Bottom Half */}
            <div className="h-1/2 flex flex-col">
                {
                    <>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="relative flex-1 max-w-sm">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearTestResults}
                                    className="text-destructive dark:text-red-500 hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear Results
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto border rounded-md">
                            <TestResultsTable runs={testRuns} testClasses={testClasses} />
                        </div>
                    </>
                }
            </div>

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

            <CoverageSheet open={isCoverageOpen} onOpenChange={setIsCoverageOpen} />
        </div>
    )
}
