'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Search, Loader2 } from 'lucide-react'
import { refreshAccessToken } from '@/lib/auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface CoverageData {
    ApexClassOrTriggerId: string
    NumLinesCovered: number
    NumLinesUncovered: number
    ApexClassName: string
    Coverage: {
        coveredLines: number[]
        uncoveredLines: number[]
    }
}

interface CoverageSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CoverageSheet({ open, onOpenChange }: CoverageSheetProps) {
    const router = useRouter()
    const [coverage, setCoverage] = useState<CoverageData[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [error, setError] = useState<string | null>(null)

    const fetchCoverage = async () => {
        setLoading(true)
        setError(null)

        try {
            const refreshToken = localStorage.getItem('sf_refresh_token')
            if (!refreshToken) {
                throw new Error('No refresh token found')
            }

            const { access_token, instance_url } = await refreshAccessToken(refreshToken)

            const response = await fetch(`/api/salesforce/coverage?instance_url=${encodeURIComponent(instance_url)}`, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch coverage data')
            }

            const data = await response.json()
            setCoverage(data)
        } catch (error) {
            console.error('Error:', error)
            setError(error instanceof Error ? error.message : 'Failed to fetch coverage')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchCoverage()
        }
    }, [open])

    const filteredCoverage = coverage.filter((item) =>
        item.ApexClassName.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Remove duplicates by ApexClassName
    const uniqueCoverage = filteredCoverage.reduce((acc: CoverageData[], current) => {
        const exists = acc.find((item) => item.ApexClassName === current.ApexClassName)
        if (!exists) {
            acc.push(current)
        }
        return acc
    }, [])

    const handleClassClick = (classId: string, coverage: CoverageData) => {
        // Navigate to explore page with coverage data
        router.push(
            `/explore?id=${classId}&type=ApexClass&coverage=${JSON.stringify({
                coveredLines: coverage.Coverage?.coveredLines || [],
                uncoveredLines: coverage.Coverage?.uncoveredLines || [],
            })}`,
        )
        onOpenChange(false)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" size="large" className="overflow-x-hidden">
                <SheetHeader>
                    <SheetTitle>Test Coverage</SheetTitle>
                </SheetHeader>

                <div className="mt-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search classes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center">{error}</div>
                    ) : (
                        <div className="overflow-auto max-h-[calc(100vh-200px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[45%]">Class Name</TableHead>
                                        <TableHead className="w-[45%]">Coverage</TableHead>
                                        <TableHead className="text-right w-[10%]">Lines</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {uniqueCoverage.map((item) => {
                                        const totalLines = item.NumLinesCovered + item.NumLinesUncovered
                                        const coveragePercent =
                                            totalLines > 0 ? Math.round((item.NumLinesCovered / totalLines) * 100) : 0

                                        return (
                                            <TableRow
                                                key={`${item.ApexClassName}-${item.ApexClassOrTriggerId}`}
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleClassClick(item.ApexClassOrTriggerId, item)}
                                            >
                                                <TableCell className="font-medium">{item.ApexClassName}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-4">
                                                        <Progress
                                                            value={coveragePercent}
                                                            className={cn(
                                                                'w-[100px]',
                                                                coveragePercent < 75
                                                                    ? 'text-red-500'
                                                                    : 'text-green-500',
                                                            )}
                                                        />
                                                        <span className="text-sm">{coveragePercent}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-sm text-muted-foreground">
                                                    {item.NumLinesCovered}/{totalLines}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
