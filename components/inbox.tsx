'use client';

import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { MessageSquare, Search } from 'lucide-react';
import { ContactList } from './contact-list';
import { MessageThread } from './message-thread';
import { ContactProfile } from './contact-profile';
import Pusher from 'pusher-js';

interface Contact {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  messages: Array<{
    id: string;
    content: string;
    channel: string;
    createdAt: string;
    direction: string;
  }>;
  _count: {
    messages: number;
  };
}

export function Inbox() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const queryClient = useQueryClient();

  // ✅ Fetch contacts
  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
  });

  // ✅ Setup realtime listener for new messages
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.warn('⚠️ Missing Pusher credentials (.env)');
      return;
    }

    const pusher = new Pusher(key, { cluster, forceTLS: true });
    const channel = pusher.subscribe('messages');

    const handleNewMessage = (data: any) => {
      console.log('📡 New message received:', data);

      // 🔁 Refresh contacts list
      queryClient.invalidateQueries({ queryKey: ['contacts'] });

      // 🔁 Refresh messages of selected contact if relevant
      if (selectedContactId === data.contactId) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedContactId] });
      }
    };

    channel.bind('new-message', handleNewMessage);

    return () => {
      channel.unbind('new-message', handleNewMessage);
      pusher.unsubscribe('messages');
      pusher.disconnect();
    };
  }, [queryClient, selectedContactId]);

  const selectedContact = contacts?.find((c) => c.id === selectedContactId);

  // ✅ Filter logic
  const filteredContacts = contacts?.filter((contact) => {
    const matchesSearch =
      !searchQuery ||
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel =
      !channelFilter || contact.messages.some((m) => m.channel === channelFilter);

    return matchesSearch && matchesChannel;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Contact List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <MessageSquare className="w-6 h-6" />
            Unified Inbox
          </h1>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mt-3">
            {['All', 'SMS', 'WHATSAPP'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch === 'All' ? null : ch)}
                className={`px-3 py-1 rounded-full text-sm ${
                  (ch === 'All' && !channelFilter) || channelFilter === ch
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredContacts && filteredContacts.length > 0 ? (
            <ContactList
              contacts={filteredContacts}
              selectedContactId={selectedContactId}
              onSelectContact={setSelectedContactId}
            />
          ) : (
            <div className="p-4 text-center text-gray-500">No contacts found</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContactId && selectedContact ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">
                  {selectedContact.name || selectedContact.phone || 'Unknown'}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedContact._count.messages} messages
                </p>
              </div>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {showProfile ? 'Hide Profile' : 'View Profile'}
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <MessageThread contactId={selectedContactId} />
              {showProfile && (
                <ContactProfile
                  contact={selectedContact}
                  onClose={() => setShowProfile(false)}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Select a contact to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
