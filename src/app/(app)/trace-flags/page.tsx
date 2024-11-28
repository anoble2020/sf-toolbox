'use client'

import { useState, useEffect } from 'react'
import {
    queryTraceFlags,
    renewTraceFlag,
    deleteTraceFlag,
    queryUsers,
    queryDebugLevels,
    type TraceFlag,
    type SalesforceUser,
    type DebugLevel,
    createTraceFlag,
} from '@/lib/salesforce'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddTraceFlagModal } from '@/components/AddTraceFlagModal'
import { CACHE_DURATIONS } from '@/lib/constants'
import { toast } from 'sonner'

type SortDirection = 'asc' | 'desc'

export default function TraceFlagsPage() {
    const [traceFlags, setTraceFlags] = useState<TraceFlag[]>([])
    const [users, setUsers] = useState<SalesforceUser[]>([])
    const [debugLevels, setDebugLevels] = useState<DebugLevel[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        let mounted = true

        const loadData = async () => {
            try {
                const cachedData = localStorage.getItem('cached_trace_flags')
                if (cachedData) {
                    const parsed = JSON.parse(cachedData)
                    if (Date.now() - parsed.lastFetched < CACHE_DURATIONS.LONG) {
                        if (mounted) {
                            setTraceFlags(parsed.flags)
                            setUsers(parsed.users)
                            setDebugLevels(parsed.levels)
                            setLoading(false)
                        }
                        return
                    }
                }

                const [flags, usersList, levels] = await Promise.all([
                    queryTraceFlags(),
                    queryUsers(),
                    queryDebugLevels(),
                ])

                if (mounted) {
                    setTraceFlags(flags)
                    setUsers(usersList)
                    setDebugLevels(levels)
                }

                const cacheData = {
                    flags,
                    users: usersList,
                    levels,
                    lastFetched: Date.now(),
                }
                localStorage.setItem('cached_trace_flags', JSON.stringify(cacheData))
            } catch (error) {
                if (mounted) {
                    console.error('Failed to load data:', error)
                    setError(error instanceof Error ? error.message : 'Failed to load data')
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        loadData()

        return () => {
            mounted = false
        }
    }, [])

    const handleRenew = async (id: string) => {
        try {
            setRefreshing(true)
            await renewTraceFlag(id)

            // Update cache with new expiration date
            const cachedData = localStorage.getItem('cached_trace_flags')
            if (cachedData) {
                const parsed = JSON.parse(cachedData)
                const updatedFlags = parsed.flags.map((flag: TraceFlag) => {
                    if (flag.Id === id) {
                        return {
                            ...flag,
                            ExpirationDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
                            StartDate: new Date().toISOString(),
                        }
                    }
                    return flag
                })

                const updatedCache = {
                    ...parsed,
                    flags: updatedFlags,
                    lastFetched: Date.now(),
                }
                localStorage.setItem('cached_trace_flags', JSON.stringify(updatedCache))
                setTraceFlags(updatedFlags)
            } else {
                // If no cache exists, fetch fresh data
                await loadData()
            }
        } catch (error) {
            console.error('Failed to renew trace flag:', error)
        } finally {
            setRefreshing(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this trace flag?')) {
            return
        }

        try {
            setRefreshing(true)
            await deleteTraceFlag(id)

            // Update cache after successful deletion
            const cachedData = localStorage.getItem('cached_trace_flags')
            if (cachedData) {
                const parsed = JSON.parse(cachedData)
                const updatedFlags = parsed.flags.filter((flag: TraceFlag) => flag.Id !== id)
                const updatedCache = {
                    ...parsed,
                    flags: updatedFlags,
                    lastFetched: Date.now(),
                }
                localStorage.setItem('cached_trace_flags', JSON.stringify(updatedCache))
                setTraceFlags(updatedFlags)
            } else {
                await loadData()
            }
        } catch (error) {
            console.error('Failed to delete trace flag:', error)
            setError(error instanceof Error ? error.message : 'Failed to delete trace flag')
        } finally {
            setRefreshing(false)
        }
    }

    const sortTraceFlags = (flags: TraceFlag[], direction: SortDirection) => {
        return [...flags].sort((a, b) => {
            const nameA = a.TracedEntity.Name.toLowerCase()
            const nameB = b.TracedEntity.Name.toLowerCase()
            return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        })
    }

    const toggleSort = () => {
        const newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
        setSortDirection(newDirection)
        setTraceFlags(sortTraceFlags(traceFlags, newDirection))
    }

    const isExpired = (expirationDate: string) => {
        if (!expirationDate) return true
        const date = new Date(expirationDate)
        return !isNaN(date.getTime()) && date <= new Date()
    }

    const handleCreateTraceFlag = async (userId: string, debugLevelId: string) => {
        try {
            const newFlag = await createTraceFlag(userId, debugLevelId, 'USER_DEBUG')

            // Update cache with new trace flag
            const cachedData = localStorage.getItem('cached_trace_flags')
            if (cachedData) {
                const parsed = JSON.parse(cachedData)
                // Find the user and debug level info from our cached data
                const user = parsed.users.find((u: SalesforceUser) => u.Id === userId)
                const debugLevel = parsed.levels.find((d: DebugLevel) => d.Id === debugLevelId)

                // Structure the new flag to match the expected format
                const structuredFlag = {
                    ...newFlag,
                    Id: userId,
                    TracedEntity: {
                        Name: user?.Name || 'Unknown User',
                    },
                    DebugLevel: {
                        Id: debugLevelId,
                        MasterLabel: debugLevel?.MasterLabel || 'Unknown Debug Level',
                    },
                }

                const updatedFlags = [...parsed.flags, structuredFlag]
                const updatedCache = {
                    ...parsed,
                    flags: updatedFlags,
                    lastFetched: Date.now(),
                }
                localStorage.setItem('cached_trace_flags', JSON.stringify(updatedCache))
                setTraceFlags(updatedFlags)
                toast.success('Trace flag created successfully')
            } else {
                await loadData()
            }
        } catch (error) {
            console.error('Failed to create trace flag:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create trace flag')
        }
    }

    if (loading) {
        return (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        )
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <Button onClick={() => setIsModalOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trace Flag
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={toggleSort}>
                            Username {sortDirection === 'asc' ? '↑' : '↓'}
                        </TableHead>
                        <TableHead>Log Level</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortTraceFlags(traceFlags, sortDirection).map((flag) => (
                        <TableRow key={`trace-flag-${flag.Id}`}>
                            <TableCell>{flag.TracedEntity?.Name || 'Unknown'}</TableCell>
                            <TableCell>{flag.DebugLevel?.MasterLabel || 'Unknown'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Circle
                                        //key={`circle-${flag.Id}`}
                                        className={cn(
                                            'h-3 w-3 fill-current',
                                            isExpired(flag.ExpirationDate) ? 'text-red-500' : 'text-green-500',
                                        )}
                                    />
                                    {flag.ExpirationDate
                                        ? format(new Date(flag.ExpirationDate), 'MMM d, yyyy h:mm a')
                                        : 'No expiration date'}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        //key={`renew-${flag.Id}`}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRenew(flag.Id)}
                                        disabled={refreshing}
                                    >
                                        Renew
                                    </Button>
                                    <Button
                                        //key={`delete-${flag.Id}`}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(flag.Id)}
                                        disabled={refreshing}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AddTraceFlagModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateTraceFlag}
                users={users}
                debugLevels={debugLevels}
            />
        </div>
    )
}
