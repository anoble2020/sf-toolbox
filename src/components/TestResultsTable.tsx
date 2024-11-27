'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface TestRun {
    classId: string
    testRunId: string
    status: 'running' | 'completed'
    results?: any[]
    coverage?: any[]
    error?: string
}

interface TestResultsTableProps {
    runs: TestRun[]
    testClasses: any[]
}

export function TestResultsTable({ runs, testClasses }: TestResultsTableProps) {
    const [expandedRuns, setExpandedRuns] = useState<string[]>([])

    const toggleExpanded = (runId: string) => {
        setExpandedRuns((prev) => (prev.includes(runId) ? prev.filter((id) => id !== runId) : [...prev, runId]))
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pass/Fail</TableHead>
                    <TableHead>Run Time</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {runs.map((run) => {
                    const testClass = testClasses.find((c) => c.Id === run.classId)
                    const isExpanded = expandedRuns.includes(run.testRunId)
                    const lastRunTime = run.results?.[0]?.TestTimestamp

                    if (!testClass) return null

                    return (
                        <React.Fragment key={run.testRunId}>
                            <TableRow>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpanded(run.testRunId)}
                                        disabled={run.status === 'running'}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TableCell>
                                <TableCell>{testClass.Name}</TableCell>
                                <TableCell>
                                    {run.error ? <span className="text-red-500">Error</span> : run.status}
                                </TableCell>
                                <TableCell>
                                    {run.status === 'completed' ? (
                                        run.error ? (
                                            <span className="text-red-500">{run.error}</span>
                                        ) : (
                                            `${run.results?.filter((r) => r.Outcome === 'Pass').length || 0}/${run.results?.length || 0}`
                                        )
                                    ) : (
                                        'Running...'
                                    )}
                                </TableCell>
                                <TableCell>
                                    {lastRunTime ? format(new Date(lastRunTime), 'MMM d, yyyy h:mm a') : '-'}
                                </TableCell>
                            </TableRow>
                            {isExpanded && run.status === 'completed' && !run.error && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <div className="p-4 bg-gray-50">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Method</TableHead>
                                                        <TableHead>Outcome</TableHead>
                                                        <TableHead>Runtime (ms)</TableHead>
                                                        <TableHead>Message</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {run.results?.map((result: any) => (
                                                        <TableRow key={result.Id}>
                                                            <TableCell>{result.MethodName}</TableCell>
                                                            <TableCell>{result.Outcome}</TableCell>
                                                            <TableCell>{result.RunTime}</TableCell>
                                                            <TableCell>{result.Message || '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    )
                })}
            </TableBody>
        </Table>
    )
}
