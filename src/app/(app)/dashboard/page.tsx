'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Code, Users, Bell, Database, Shield, Box, Clock, Loader } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { refreshAccessToken } from '@/lib/auth'

const SalesforceDashboard = () => {
    const [timeRange] = useState('24h')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [orgData, setOrgData] = useState<any>(null)

    useEffect(() => {
        const fetchOrgData = async () => {
            try {
                const refreshToken = localStorage.getItem('sf_refresh_token')
                if (!refreshToken) throw new Error('No refresh token found')

                const { access_token, instance_url } = await refreshAccessToken(refreshToken)

                const response = await fetch(
                    `/api/salesforce/limits?instance_url=${encodeURIComponent(instance_url)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                        },
                    },
                )

                if (!response.ok) throw new Error('Failed to fetch org data')

                const data = await response.json()
                setOrgData(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch org data')
            } finally {
                setLoading(false)
            }
        }

        fetchOrgData()
    }, [])

    if (loading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>
    if (!orgData?.limits) return <div>No data available</div>

    const {
        DailyApiRequests = { Max: 0, Remaining: 0 },
        DataStorageMB = { Max: 0, Remaining: 0 },
        FileStorageMB = { Max: 0, Remaining: 0 },
        DailyAsyncApexExecutions = { Max: 0, Remaining: 0 },
        DailyBulkApiBatches = { Max: 0, Remaining: 0 },
        DailyBulkV2QueryJobs = { Max: 0, Remaining: 0 },
        DailyAsyncApexTests = { Max: 0, Remaining: 0 },
        HourlyPublishedPlatformEvents = { Max: 0, Remaining: 0 },
        HourlyPublishedStandardVolumePlatformEvents = { Max: 0, Remaining: 0 },
        DailyStandardVolumePlatformEvents = { Max: 0, Remaining: 0 },
        DailyDeliveredPlatformEvents = { Max: 0, Remaining: 0 },
        MassEmail = { Max: 0, Remaining: 0 },
        SingleEmail = { Max: 0, Remaining: 0 },
    } = orgData.limits

    return (
        <div className="p-6 space-y-6 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Code className="w-6 h-6 text-blue-500" />
                            <CardTitle>API Requests</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {DailyApiRequests.Remaining.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Daily limit: {DailyApiRequests.Max.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Users className="w-6 h-6 text-green-500" />
                            <CardTitle>Bulk API Requests</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {DailyBulkApiBatches.Remaining.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Daily batches limit: {DailyBulkApiBatches.Max.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Bell className="w-6 h-6 text-purple-500" />
                            <CardTitle>Async Apex</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {DailyAsyncApexExecutions.Remaining.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Daily limit: {DailyAsyncApexExecutions.Max.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>API Usage Trend ({timeRange})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={orgData.events}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="LogDate" />
                                <YAxis />
                                <Tooltip />
                                <Line 
                                    type="monotone" 
                                    dataKey="LogFileLength" 
                                    stroke="#2563eb" 
                                    strokeWidth={2} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Database className="w-6 h-6 text-blue-500" />
                            <CardTitle>Storage Usage</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span>File Storage</span>
                                <span className="font-medium">
                                    {(FileStorageMB.Remaining)} GB / {(FileStorageMB.Max)} GB
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Data Storage</span>
                                <span className="font-medium">
                                    {(DataStorageMB.Remaining)} GB / {(DataStorageMB.Max)} GB
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Shield className="w-6 h-6 text-green-500" />
                            <CardTitle>Security Metrics</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span>Failed Login Attempts (24h)</span>
                                <span className="font-medium">23</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Password Resets (24h)</span>
                                <span className="font-medium">7</span>
                            </div>
                            <div className="flex justify-between">
                                <span>API Security Events (24h)</span>
                                <span className="font-medium">12</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Box className="w-6 h-6 text-purple-500" />
                            <CardTitle>Apex Resources</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span>Cursors Remaining</span>
                                <span className="font-medium">42 / 50</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cursor Rows Remaining</span>
                                <span className="font-medium">45,678 / 50,000</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Clock className="w-6 h-6 text-orange-500" />
                            <CardTitle>Async Apex Executions</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span>Remaining Daily Async Executions</span>
                                <span className="font-medium">{DailyAsyncApexExecutions.Remaining} / {DailyAsyncApexExecutions.Max}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Remaing Daily Async Apex Tests</span>
                                <span className="font-medium">{DailyAsyncApexTests.Remaining} / {DailyAsyncApexTests.Max}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Loader className="w-6 h-6 text-indigo-500" />
                            <CardTitle>Batch Allocations</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span>Batch Jobs Remaining</span>
                                <span className="font-medium">4 / 5</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Batch Job Items Processed</span>
                                <span className="font-medium">145,678</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default SalesforceDashboard
