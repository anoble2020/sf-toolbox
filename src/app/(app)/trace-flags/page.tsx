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
  createTraceFlag
} from '@/lib/salesforce'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { format } from 'date-fns'
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddTraceFlagModal } from '@/components/AddTraceFlagModal'

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

  const loadData = async () => {
    try {
      setLoading(true)
      const [flags, usersList, levels] = await Promise.all([
        queryTraceFlags(),
        queryUsers(),
        queryDebugLevels()
      ])
      setTraceFlags(flags)
      setUsers(usersList)
      setDebugLevels(levels)
    } catch (error) {
      console.error('Failed to load data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRenew = async (id: string) => {
    try {
      setRefreshing(true)
      await renewTraceFlag(id)
      await loadData() // Refresh the list
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
      await loadData()
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
      return direction === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
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

  const handleCreateTraceFlag = async (userId: string, debugLevelId: string) => {
    try {
      await createTraceFlag(userId, debugLevelId, 'USER_DEBUG')
      await loadData()
    } catch (error) {
      console.error('Failed to create trace flag:', error)
      setError(error instanceof Error ? error.message : 'Failed to create trace flag')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="text-center justify-center mt-16">
      <h2 className="text-xl font-medium mb-4">Retrieving Trace Flags...</h2>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
    </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Trace Flags</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Trace Flag
        </Button>
      </div>
      
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
              <TableCell>{flag.TracedEntity.Name}</TableCell>
              <TableCell>{flag.DebugLevel.MasterLabel}</TableCell>
              <TableCell>
              <div className="flex items-center gap-2">
                    <Circle 
                      className={cn(
                        "h-3 w-3 fill-current",
                        isExpired(flag.ExpirationDate) 
                          ? "text-red-500" 
                          : "text-green-500"
                      )}
                    />
                {format(new Date(flag.ExpirationDate), 'MMM d, yyyy h:mm a')}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRenew(flag.Id)}
                    disabled={refreshing}
                  >
                    Renew
                  </Button>
                  <Button
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