'use client';

import { useQuery } from '@tanstack/react-query'; // ✅ Corrected import
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, MessageSquare, Clock } from 'lucide-react';

/**
 * Analytics Dashboard Component
 * Displays engagement metrics and charts
 */
export function AnalyticsDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center text-gray-500">
        No analytics data available
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const totalMessages = analytics.messagesByChannel.reduce(
    (acc: number, item: any) => acc + item.count,
    0
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Messages</p>
              <p className="text-3xl font-bold">{totalMessages}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Contacts</p>
              <p className="text-3xl font-bold">{analytics.totalContacts}</p>
            </div>
            <Users className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Contacts</p>
              <p className="text-3xl font-bold">{analytics.activeContacts}</p>
              <p className="text-xs text-gray-400">Last 30 days</p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Response Time</p>
              <p className="text-3xl font-bold">
                {analytics.avgResponseTimeMinutes.toFixed(1)}m
              </p>
            </div>
            <Clock className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages by Channel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Messages by Channel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.messagesByChannel}
                dataKey="count"
                nameKey="channel"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {analytics.messagesByChannel.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Messages by Direction */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Inbound vs Outbound</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.messagesByDirection}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="direction" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Messages Over Time */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Messages Over Time (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.messagesOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Message Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Message Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.messagesByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Integration Comparison Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Integration Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Channel</th>
                <th className="text-left py-3 px-4">Latency</th>
                <th className="text-left py-3 px-4">Cost per Message</th>
                <th className="text-left py-3 px-4">Reliability</th>
                <th className="text-left py-3 px-4">Features</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">SMS</td>
                <td className="py-3 px-4">~1-5 seconds</td>
                <td className="py-3 px-4">$0.0075</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    99.9%
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">Text, MMS</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">WhatsApp</td>
                <td className="py-3 px-4">~1-3 seconds</td>
                <td className="py-3 px-4">$0.005</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    99.5%
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">Text, Media, Templates</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Email</td>
                <td className="py-3 px-4">~5-30 seconds</td>
                <td className="py-3 px-4">$0.001</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                    98%
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">Rich text, Attachments</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Twitter DM</td>
                <td className="py-3 px-4">~2-10 seconds</td>
                <td className="py-3 px-4">Free</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                    95%
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">Text, Media, Rate Limited</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
