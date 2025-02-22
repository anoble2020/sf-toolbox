'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Code, Users, Bell, Database, Shield, Radio, Clock, TrendingUp, Mail, Loader2 } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { refreshAccessToken } from '@/lib/auth'
import { formatInTimeZone } from 'date-fns-tz'
import { storage } from '@/lib/storage'
import { useSearchParams } from 'next/navigation'

const SalesforceDashboard = () => {
    const [timeRange] = useState('24h')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [orgData, setOrgData] = useState<any>(null)
    const [userTimezone, setUserTimezone] = useState<string | null>(null)
    const searchParams = useSearchParams()

    useEffect(() => {
        console.log('Dashboard mounted');
        const currentDomain = storage.getCurrentDomain()
        const userTimezone = storage.getFromDomain(currentDomain || '', 'sf_user_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(userTimezone)
    }, [])

    useEffect(() => {
        const fetchOrgData = async () => {
            try {
                // Log URL parameters
                console.log('Dashboard - URL params:', 
                          Object.fromEntries(searchParams.entries()))
                
                // Get current domain and log it
                const currentDomain = storage.getCurrentDomain()
                console.log('Dashboard - Current domain:', currentDomain)
                
                if (!currentDomain) {
                    throw new Error('No current domain found')
                }

                const refreshToken = storage.getFromDomain(currentDomain, 'refresh_token')
                console.log('Dashboard - Has refresh token:', !!refreshToken)
                
                if (!refreshToken) {
                    throw new Error('No refresh token found')
                }

                const { access_token, instance_url } = await refreshAccessToken(refreshToken);

                const response = await fetch(
                    `/api/salesforce/limits?instance_url=${encodeURIComponent(instance_url)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                        },
                    },
                );

                if (!response.ok) throw new Error('Failed to fetch org data');

                const data = await response.json();
                setOrgData(data);
            } catch (err) {
                console.error('Error in fetchOrgData:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch org data');
            } finally {
                setLoading(false);
            }
        };

        fetchOrgData();
    }, [searchParams]);

    useEffect(() => {
        console.log('Dashboard mounted');
        const currentDomain = storage.getCurrentDomain();
        console.log('Current domain from storage:', currentDomain);
        
        // Log all stored data
        const allData = JSON.parse(localStorage.getItem('sf_data') || '{}');
        console.log('All stored SF data:', allData);
        
        // Check refresh token for current domain
        if (currentDomain) {
            const refreshToken = storage.getFromDomain(currentDomain, 'refresh_token');
            console.log('Has refresh token for current domain:', !!refreshToken);
        }
    }, []);

    if(loading){
        return (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
    )}
    if (error) return <div className="text-center justify-center">Error: {error}</div>
    if (!orgData?.limits) return <div className="text-center justify-center">No data available</div>

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
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Code className="w-6 h-6 text-blue-500" />
                            <CardTitle>API Requests (Remaining)</CardTitle>
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
                            <CardTitle>Bulk API Requests (Remaining)</CardTitle>
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
                            <CardTitle>Async Apex (Remaining)</CardTitle>
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
                <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-purple-900" />
                        <CardTitle>API Usage Trend ({timeRange})</CardTitle>
                    </div>
                    <div className="text-sm text-muted-foreground justify-end">
                        Total Requests (24h): {
                            orgData.events?.[0]?.dataPoints?.reduce((sum: number, point: any) => sum + (point.count || 0), 0).toLocaleString() || 0
                        }
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={orgData.events?.[0]?.dataPoints || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="timestamp"
                                    tickFormatter={(value) => {
                                        if (!value || typeof value !== 'string') return '';
                                        try {
                                            const date = new Date(
                                                parseInt(value.substring(0, 4)),
                                                parseInt(value.substring(4, 6)) - 1,
                                                parseInt(value.substring(6, 8)),
                                                parseInt(value.substring(8, 10)),
                                                parseInt(value.substring(10, 12))
                                            );
                                            return formatInTimeZone(
                                                date,
                                                userTimezone || 'UTC',
                                                'h:mm a'
                                            );
                                        } catch (e) {
                                            return '';
                                        }
                                    }}
                                />
                                <YAxis 
                                    label={{ value: 'Number of Requests', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                    labelFormatter={(value) => {
                                        if (!value || typeof value !== 'string') return '';
                                        try {
                                            const date = new Date(
                                                parseInt(value.substring(0, 4)),
                                                parseInt(value.substring(4, 6)) - 1,
                                                parseInt(value.substring(6, 8)),
                                                parseInt(value.substring(8, 10)),
                                                parseInt(value.substring(10, 12))
                                            );
                                            return formatInTimeZone(
                                                date,
                                                userTimezone || 'UTC',
                                                'MMM d, h:mm a'
                                            );
                                        } catch (e) {
                                            return '';
                                        }
                                    }}
                                    formatter={(value: number) => [`${value?.toLocaleString() || 0} requests`, 'API Requests']}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    name="Request Count"
                                    stroke="#2563eb" 
                                    strokeWidth={2}
                                    dot={false}
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

                <Card className="col-span-2">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Radio className="w-6 h-6 text-purple-500" />
                            <CardTitle>Platform Events (Remaining)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex justify-between">
                                <span>Hourly Published Platform Events</span>
                                <span className="font-medium">{HourlyPublishedPlatformEvents.Remaining} / {HourlyPublishedPlatformEvents.Max}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Hourly Published Standard Volume Platform Events</span>
                                <span className="font-medium">{HourlyPublishedStandardVolumePlatformEvents.Remaining} / {HourlyPublishedStandardVolumePlatformEvents.Max}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Daily Published Platform Events</span>
                                <span className="font-medium">{DailyStandardVolumePlatformEvents.Remaining} / {DailyStandardVolumePlatformEvents.Max}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Daily Delivered Platform Events</span>
                                <span className="font-medium">{DailyDeliveredPlatformEvents.Remaining} / {DailyDeliveredPlatformEvents.Max}</span>
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
                            <Mail className="w-6 h-6 text-indigo-500" />
                            <CardTitle>Email Allocations</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span>Single Email Remaining</span>
                                <span className="font-medium">{SingleEmail.Remaining} / {SingleEmail.Max}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Mass Email Remaining</span>
                                <span className="font-medium">{MassEmail.Remaining} / {MassEmail.Max}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function Dashboard() {
    return (
        <Suspense fallback={
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
        }>
            <SalesforceDashboard />
        </Suspense>
    )
}
