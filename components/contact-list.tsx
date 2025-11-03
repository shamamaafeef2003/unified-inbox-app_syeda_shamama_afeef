'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Phone, Mail } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  channel: string;
  createdAt: string;
  direction: string;
}

interface Contact {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  messages: Message[];
  _count: {
    messages: number;
  };
}

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
}

/**
 * Contact List Component
 * Displays all contacts with their latest message preview
 */
export function ContactList({ contacts, selectedContactId, onSelectContact }: ContactListProps) {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return <MessageCircle className="w-4 h-4" />;
      case 'WHATSAPP':
        return <Phone className="w-4 h-4" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return 'bg-blue-100 text-blue-700';
      case 'WHATSAPP':
        return 'bg-green-100 text-green-700';
      case 'EMAIL':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {contacts.map((contact) => {
        const latestMessage = contact.messages[0];
        const isSelected = contact.id === selectedContactId;

        return (
          <button
            key={contact.id}
            onClick={() => onSelectContact(contact.id)}
            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900">
                {contact.name || contact.phone || contact.email || 'Unknown Contact'}
              </h3>
              {latestMessage && (
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(latestMessage.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              {contact.phone && (
                <span className="text-xs text-gray-500">{contact.phone}</span>
              )}
              {latestMessage && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getChannelColor(latestMessage.channel)}`}>
                  {getChannelIcon(latestMessage.channel)}
                  {latestMessage.channel}
                </span>
              )}
            </div>

            {latestMessage && (
              <p className="text-sm text-gray-600 truncate">
                {latestMessage.direction === 'INBOUND' ? '← ' : '→ '}
                {latestMessage.content}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">
                {contact._count.messages} message{contact._count.messages !== 1 ? 's' : ''}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}