'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Code, Users, Bell, Database, Shield, Clock, Box, Loader } from 'lucide-react';

const MetricCard = ({ title, value, subValue, icon: Icon, description }) => (
  <Card className="col-span-1">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            {subValue && <p className="text-sm text-gray-600">{subValue}</p>}
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </CardContent>
  </Card>
);

// Sample data - in real implementation, this would come from the Tooling API
const apiLimitData = [
  { time: '00:00', used: 85000 },
  { time: '04:00', used: 92000 },
  { time: '08:00', used: 143000 },
  { time: '12:00', used: 156000 },
  { time: '16:00', used: 178000 },
  { time: '20:00', used: 189000 },
];

const SalesforceDashboard = () => {
  const [timeRange] = useState('24h');

  return (
    <div className="p-6 space-y-6 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          title="API Requests Remaining"
          value="811,000"
          icon={Code}
          description="Daily API request limit: 1M"
        />
        <MetricCard
          title="Active Users"
          value="847"
          icon={Users}
          description="Users logged in within last 24h"
        />
        <MetricCard
          title="Platform Events"
          value="45,678"
          subValue="1,890 / hour"
          icon={Bell}
          description="Event messages delivered (24h)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Usage Trend ({timeRange})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={apiLimitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="used" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <span className="font-medium">34.2 GB / 100 GB</span>
              </div>
              <div className="flex justify-between">
                <span>Data Storage</span>
                <span className="font-medium">1.8 GB / 5 GB</span>
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
                <span className="font-medium">234,567 / 250,000</span>
              </div>
              <div className="flex justify-between">
                <span>Current Queue Size</span>
                <span className="font-medium">45</span>
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
  );
};

export default SalesforceDashboard;