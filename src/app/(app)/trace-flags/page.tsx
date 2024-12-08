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
import { storage } from '@/lib/storage'

type SortDirection = 'asc' | 'desc'

type CreateTraceFlagResponse = {
    Id: string;
    ExpirationDate?: string;
}

export default function TraceFlagsPage() {
    const [traceFlags, setTraceFlags] = useState<TraceFlag[]>([])
    const [users, setUsers] = useState<SalesforceUser[]>([])
    const [debugLevels, setDebugLevels] = useState<DebugLevel[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [sortField, setSortField] = useState<keyof TraceFlag>('ExpirationDate')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        let mounted = true
        loadData(mounted)
        return () => {
            mounted = false
        }
    }, [])

    const loadData = async (mounted?: boolean) => {
        try {
            const currentDomain = storage.getCurrentDomain();
            if (!currentDomain) {
                throw new Error('No current domain found');
            }

            const cachedData = storage.getFromDomain(currentDomain, 'cached_trace_flags');
            if (cachedData) {
                const debugLevels = cachedData.levels as DebugLevel[];
                const users = cachedData.users as SalesforceUser[];
                const flags = cachedData.flags as TraceFlag[];
                
                if (Date.now() - cachedData.lastFetched < CACHE_DURATIONS.LONG) {
                    if (mounted) {
                        setTraceFlags(flags);
                        setUsers(users);
                        setDebugLevels(debugLevels);
                        setLoading(false);
                    }
                    return;
                }
            }

            const [flags, usersList, levels] = await Promise.all([
                queryTraceFlags(),
                queryUsers(),
                queryDebugLevels(),
            ]);

            if (mounted) {
                setTraceFlags(flags);
                setUsers(usersList);
                setDebugLevels(levels);
            }

            const cacheData = {
                flags,
                users: usersList,
                levels,
                lastFetched: Date.now(),
            };
            
            storage.setForDomain(currentDomain, 'cached_trace_flags', cacheData);
        } catch (error: any) {
            if (mounted) {
                console.error('Failed to load data:', error);
                setError(error instanceof Error ? error.message : 'Failed to load data');
            }
        } finally {
            if (mounted) {
                setLoading(false);
            }
        }
    };

    const handleRenew = async (id: string) => {
        try {
            setRefreshing(true);
            await renewTraceFlag(id);

            const currentDomain = storage.getCurrentDomain();
            if (!currentDomain) {
                throw new Error('No current domain found');
            }

            const cachedData = storage.getFromDomain(currentDomain, 'cached_trace_flags');
            if (cachedData) {
                const updatedFlags = cachedData.flags.map((flag: TraceFlag) => {
                    if (flag.Id === id) {
                        return {
                            ...flag,
                            ExpirationDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
                            StartDate: new Date().toISOString(),
                        };
                    }
                    return flag;
                });

                const updatedCache = {
                    ...cachedData,
                    flags: updatedFlags,
                    lastFetched: Date.now(),
                };
                storage.setForDomain(currentDomain, 'cached_trace_flags', updatedCache);
                setTraceFlags(updatedFlags);
            } else {
                await loadData()
            }
        } catch (error: any) {
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

            const currentDomain = storage.getCurrentDomain();
            if (!currentDomain) {
                throw new Error('No current domain found');
            }

            const cachedData = storage.getFromDomain(currentDomain, 'cached_trace_flags');
            if (cachedData) {
                const updatedFlags = cachedData.flags.filter((flag: TraceFlag) => flag.Id !== id);
                const updatedCache = {
                    ...cachedData,
                    flags: updatedFlags,
                    lastFetched: Date.now(),
                };
                storage.setForDomain(currentDomain, 'cached_trace_flags', updatedCache);
                setTraceFlags(updatedFlags);
            } else {
                await loadData()
            }
        } catch (error: any) {
            console.error('Failed to delete trace flag:', error)
            setError(error instanceof Error ? error.message : 'Failed to delete trace flag')
        } finally {
            setRefreshing(false)
        }
    }

    const sortTraceFlags = (flags: TraceFlag[], direction: SortDirection) => {
        return [...flags].sort((a, b) => {
            const nameA = a.TracedEntity?.Name?.toLowerCase() || ''
            const nameB = b.TracedEntity?.Name?.toLowerCase() || ''
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
            console.log('Creating trace flag for:', { userId, debugLevelId })
            
            const newFlag = (await createTraceFlag(userId, debugLevelId, 'USER_DEBUG')) as unknown as CreateTraceFlagResponse;
            
            if (!newFlag?.Id) {
                console.error('Invalid flag response:', newFlag)
                throw new Error('Invalid response from create trace flag')
            }

            const currentDomain = storage.getCurrentDomain()
            if (!currentDomain) {
                throw new Error('No current domain found')
            }

            const cachedData = storage.getFromDomain(currentDomain, 'cached_trace_flags')
            console.log('Cached data:', cachedData)
            
            if (cachedData) {
                const user = cachedData.users.find((u: SalesforceUser) => u.Id === userId)
                const debugLevel = cachedData.levels.find((d: DebugLevel) => d.Id === debugLevelId)

                console.log('Found user and debug level:', { user, debugLevel })

                const structuredFlag: TraceFlag = {
                    Id: newFlag.Id,
                    TracedEntityId: userId,
                    ExpirationDate: newFlag.ExpirationDate || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
                    TracedEntity: {
                        Name: user?.Name || 'Unknown User',
                    },
                    DebugLevel: {
                        Id: debugLevelId,
                        MasterLabel: debugLevel?.MasterLabel || 'Unknown Debug Level',
                    },
                }

                const updatedFlags = [...cachedData.flags, structuredFlag]
                const updatedCache = {
                    ...cachedData,
                    flags: updatedFlags,
                    lastFetched: Date.now(),
                }
                storage.setForDomain(currentDomain, 'cached_trace_flags', updatedCache)
                setTraceFlags(updatedFlags)
                toast.success('Trace flag created successfully')
            } else {
                await loadData()
            }
        } catch (error: any) {
            console.error('Failed to create trace flag:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create trace flag')
        }
    }

    const getTraceFlagName = (traceFlag: TraceFlag) => {
        return traceFlag.TracedEntity?.Name || 'Unknown Entity'
    }

    const getDebugLevelName = (traceFlag: TraceFlag) => {
        return traceFlag.DebugLevel?.Name || traceFlag.DebugLevel?.MasterLabel || 'Unknown Level'
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
                            <TableCell>{getTraceFlagName(flag)}</TableCell>
                            <TableCell>{getDebugLevelName(flag)}</TableCell>
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
