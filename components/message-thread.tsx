'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Send, Calendar, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  channel: string;
  direction: string;
  createdAt: string;
  sentAt: string | null;
  status: string;
  user?: {
    name: string | null;
    email: string;
  };
}

interface MessageThreadProps {
  contactId: string;
}

/**
 * Message Thread Component
 * Displays conversation history and message composer
 */
export function MessageThread({ contactId }: MessageThreadProps) {
  const [messageContent, setMessageContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'SMS' | 'WHATSAPP'>('SMS');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', contactId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?contactId=${contactId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setMessageContent('');
      setScheduledDate('');
      setIsScheduling(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!messageContent.trim()) return;

    const data: any = {
      contactId,
      channel: selectedChannel,
      content: messageContent.trim(),
    };

    if (isScheduling && scheduledDate) {
      data.scheduledAt = new Date(scheduledDate).toISOString();
    }

    sendMutation.mutate(data);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages && messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg ${
                  message.direction === 'OUTBOUND'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs opacity-75">
                    {message.channel}
                  </span>
                  {message.user && message.direction === 'OUTBOUND' && (
                    <span className="text-xs opacity-75">
                      • {message.user.name || message.user.email}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-xs opacity-75">
                    {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                  </span>
                  {message.status && (
                    <span className="text-xs opacity-75">
                      {message.status.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">
            No messages yet. Start a conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Channel Selector */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSelectedChannel('SMS')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedChannel === 'SMS'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            SMS
          </button>
          <button
            onClick={() => setSelectedChannel('WHATSAPP')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedChannel === 'WHATSAPP'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            WhatsApp
          </button>
        </div>

        {/* Scheduling Options */}
        {isScheduling && (
          <div className="mb-3">
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Type your ${selectedChannel} message...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsScheduling(!isScheduling)}
              className={`p-2 rounded-lg ${
                isScheduling
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Schedule message"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!messageContent.trim() || sendMutation.isPending}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {sendMutation.isError && (
          <p className="text-red-500 text-sm mt-2">
            Error: {sendMutation.error.message}
          </p>
        )}
      </div>
    </div>
  );
}