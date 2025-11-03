'use client';

import { useState } from 'react';
import { Inbox } from '@/components/inbox';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { MessageSquare, BarChart3, Settings, Phone } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'analytics'>('inbox');

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100">
      {/* Top Navigation Bar */}
      <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 px-8 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Left side - Brand */}
          <div className="flex items-center gap-2">
            <Phone className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Unified Inbox
            </h1>
          </div>

          {/* Center - Tabs */}
          <div className="flex gap-3 justify-center items-center">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-6 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                activeTab === 'inbox'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-900/40'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Inbox
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-900/40'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>

          {/* Right side - Settings */}
          <div className="flex items-center gap-5">
            <div className="text-xs leading-tight text-right">
              <p className="text-gray-400">Twilio Trial Number</p>
              <p className="font-mono font-semibold text-gray-100">
                {process.env.NEXT_PUBLIC_TWILIO_NUMBER || '+1 (555) 000-0000'}
              </p>
            </div>

            <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'inbox' ? <Inbox /> : <AnalyticsDashboard />}
      </main>
    </div>
  );
}
