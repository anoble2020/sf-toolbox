'use client'

import { useState } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExternalLink, Copy } from 'lucide-react'
import { refreshAccessToken } from '@/lib/auth'
import { toast } from 'sonner'
interface QueryResult {
  records: Record<string, any>[]
  totalSize: number
  done: boolean
}

interface SortConfig {
  column: string | null
  direction: 'asc' | 'desc'
}

export default function QueryPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgDomain, setOrgDomain] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' })
  const [filterValue, setFilterValue] = useState('')

  const addIdToQuery = (query: string): string => {
    // Remove any leading/trailing whitespace
    const trimmedQuery = query.trim()
    
    // Extract the SELECT clause
    const selectMatch = trimmedQuery.match(/SELECT\s+(.*?)\s+FROM/i)
    if (!selectMatch) return query // Return original if no SELECT found
    
    const fields = selectMatch[1]
      .split(',')
      .map(field => field.trim())
      
    // Check if Id is already included
    // Look for exact "Id" field, not fields containing "Id"
    const hasId = fields.some(field => {
      // Handle both "Id" and "Account.Id" cases
      const parts = field.split('.')
      return parts[parts.length - 1].toLowerCase() === 'id'
    })
    
    if (!hasId) {
      // Insert Id as the first field
      const beforeFrom = trimmedQuery.slice(0, selectMatch.index + 7) // "SELECT "
      const afterFields = trimmedQuery.slice(selectMatch.index + 7 + selectMatch[1].length)
      return `${beforeFrom}Id, ${selectMatch[1]}${afterFields}`
    }
    
    return query
  }

  const executeQuery = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const refreshToken = localStorage.getItem('sf_refresh_token')
      
      if (!refreshToken) {
        throw new Error('No refresh token found')
      }

      const { access_token, instance_url } = await refreshAccessToken(refreshToken)
      setOrgDomain(instance_url.replace('https://', ''))

      // Add Id field if not present
      const modifiedQuery = addIdToQuery(query)

      const response = await fetch(
        `/api/salesforce/query?instance_url=${encodeURIComponent(instance_url)}&q=${encodeURIComponent(modifiedQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to execute query')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const truncateText = (text: string, maxLength: number = 250) => {
    if (!text || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  }

  const getNestedValue = (obj: any, path: string): string => {
    // Handle null/undefined
    if (obj == null) return '';
    
    // Split path into parts (e.g., "CreatedBy.Name" -> ["CreatedBy", "Name"])
    const parts = path.split('.');
    let value = obj;
    
    // Traverse the object following the path
    for (const part of parts) {
      value = value?.[part];
      if (value == null) return '';
    }
    
    // Convert value to string and truncate
    return truncateText(String(value));
  }

  const getColumns = () => {
    if (!results?.records.length) return [];
    const record = results.records[0];
    const columns = ['Id'];
    
    // Process each field in the first record
    Object.entries(record).forEach(([key, value]) => {
      if (key !== 'Id' && key !== 'attributes') {
        if (typeof value === 'object' && value !== null) {
          // For nested objects, add flattened column names
          Object.keys(value).forEach(nestedKey => {
            if (nestedKey !== 'attributes') {
              columns.push(`${key}.${nestedKey}`);
            }
          });
        } else {
          columns.push(key);
        }
      }
    });
    
    return columns;
  }

  const sortRecords = (records: Record<string, any>[]) => {
    if (!sortConfig.column) return records;

    return [...records].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.column!) || '';
      const bValue = getNestedValue(b, sortConfig.column!) || '';
      
      // Compare values
      const comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }

  const handleSort = (column: string) => {
    setSortConfig(current => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  const openInSalesforce = (recordId: string) => {
    window.open(`https://${orgDomain}/lightning/r/${recordId}/view`, '_blank')
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast("Record Id copied to clipboard")
    } catch (err) {
      console.error('Failed to copy:', err)
      toast("Failed to copy Id to clipboard")
    }
  }

  const filterRecords = (records: Record<string, any>[]) => {
    if (!filterValue.trim()) return records

    const searchTerm = filterValue.toLowerCase()
    return records.filter(record => {
      // Search through all values including nested objects
      const searchableValues = Object.entries(record).reduce((acc: string[], [key, value]) => {
        if (key === 'attributes') return acc
        
        if (typeof value === 'object' && value !== null) {
          // Handle nested objects
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (nestedKey !== 'attributes' && nestedValue != null) {
              acc.push(String(nestedValue).toLowerCase())
            }
          })
        } else if (value != null) {
          acc.push(String(value).toLowerCase())
        }
        return acc
      }, [])

      return searchableValues.some(val => val.includes(searchTerm))
    })
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your SOQL query..."
          className="min-h-[100px] font-mono"
        />
        
        <Button 
          onClick={executeQuery}
          disabled={loading}
        >
          Execute Query
        </Button>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {results && (
          <div className="flex flex-col flex-1 mt-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-500">
                {results.totalSize} record{results.totalSize !== 1 ? 's' : ''} returned
              </div>
              <div className="w-64">
                <Input
                  placeholder="Filter results..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
            
            <div className="border rounded-md">
              {/* Fixed header */}
              <div className="sticky top-0 bg-white z-20 border-b">
                <div className="w-full table table-fixed">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {getColumns().map((column) => (
                          <TableHead 
                            key={column}
                            className="cursor-pointer hover:bg-gray-50 min-w-[80px] bg-white w-[200px]"
                            onClick={() => handleSort(column)}
                          >
                            <div className="flex items-center gap-2">
                              {column}
                              {sortConfig.column === column && (
                                <span className="text-xs">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="min-w-[80px] bg-white w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableBody>
                    {filterRecords(sortRecords(results.records)).map((record) => (
                      <TableRow key={record.Id}>
                        {getColumns().map((column) => (
                          <TableCell 
                            key={`${record.Id}-${column}`}
                            className="min-w-[80px] w-[200px]"
                          >
                            <div className="flex items-center gap-2">
                              {getNestedValue(record, column)}
                              {column === 'Id' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboard(record.Id)
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-gray-100"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="min-w-[80px] w-[80px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openInSalesforce(record.Id)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 