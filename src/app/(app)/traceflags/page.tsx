'use client'

import React, { useState, useEffect } from 'react'
import { queryTraceFlags, renewTraceFlag, type TraceFlag } from '@/lib/salesforce'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true
})

type SortDirection = 'asc' | 'desc'

export default function TraceFlagsPage() {
  const [traceFlags, setTraceFlags] = useState<TraceFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const loadTraceFlags = async () => {
    try {
      setLoading(true)
      setError(null)
      const flags = await queryTraceFlags()
      console.log('Loaded trace flags:', flags)
      setTraceFlags(sortTraceFlags(flags, sortDirection))
    } catch (error) {
      console.error('Failed to load trace flags:', error)
      setError(error instanceof Error ? error.message : 'Failed to load trace flags')
    } finally {
      setLoading(false)
    }
  }

  const handleRenew = async (id: string) => {
    try {
      setRefreshing(true)
      await renewTraceFlag(id)
      await loadTraceFlags()
    } catch (error) {
      console.error('Failed to renew trace flag:', error)
      setError(error instanceof Error ? error.message : 'Failed to renew trace flag')
    } finally {
      setRefreshing(false)
    }
  }
  const sortTraceFlags = (flags: TraceFlag[], direction: SortDirection) => {
    return [...flags].sort((a, b) => {
      const nameA = a?.TracedEntity?.Name?.toLowerCase() ?? ''
      const nameB = b?.TracedEntity?.Name?.toLowerCase() ?? ''
      return direction === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB?.localeCompare(nameA)
    })
  }

  const toggleSort = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    setSortDirection(newDirection)
    setTraceFlags(sortTraceFlags(traceFlags, newDirection))
  }

  const isExpired = (expirationDate: string) => {
    return new Date(expirationDate) <= new Date()
  }

  useEffect(() => {
    loadTraceFlags()
  }, [])

  if (loading) {
    return <div className="p-4">Loading trace flags...</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Trace Flags</h1>
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {traceFlags.length === 0 && !error ? (
        <div className="text-gray-500">No trace flags found</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={toggleSort}
              >
                Username {sortDirection === 'asc' ? '↑' : '↓'}
              </TableHead>
              <TableHead>Log Level</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {traceFlags.map((flag) => (
              <TableRow key={flag.Id}>
                <TableCell>{flag.TracedEntity?.Name}</TableCell>
                <TableCell>{flag.DebugLevel?.MasterLabel}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <svg
                      className={cn(
                        "h-3 w-3 fill-current",
                        isExpired(flag.ExpirationDate) 
                          ? "text-red-500" 
                          : "text-green-500"
                      )}
                    />
                    {dateFormatter.format(new Date(flag.ExpirationDate))}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRenew(flag.Id)}
                    disabled={refreshing}
                  >
                    Renew
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
} 