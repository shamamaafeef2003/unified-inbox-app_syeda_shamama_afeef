'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Lock, Unlock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Contact {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  tags?: string[];
}

interface Note {
  id: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface ContactProfileProps {
  contact: Contact;
  onClose: () => void;
}

/**
 * Contact Profile Component
 * Shows contact details, notes, and activity history
 */
export function ContactProfile({ contact, onClose }: ContactProfileProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);
  const queryClient = useQueryClient();

  // Mock userId - in real app, get from auth context
  const userId = 'user-123';

  const { data: notes } = useQuery<Note[]>({
    queryKey: ['notes', contact.id],
    queryFn: async () => {
      const res = await fetch(`/api/notes?contactId=${contact.id}&userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', contact.id] });
      setNoteContent('');
      setIsPrivateNote(false);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', contact.id] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update contact');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEditMode(false);
    },
  });

  const handleAddNote = () => {
    if (!noteContent.trim()) return;

    createNoteMutation.mutate({
      contactId: contact.id,
      userId,
      content: noteContent.trim(),
      isPrivate: isPrivateNote,
    });
  };

  const handleUpdateContact = () => {
    updateContactMutation.mutate({
      id: contact.id,
      ...editedContact,
    });
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contact Profile</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Contact Info */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Contact Information</h3>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editMode ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={editedContact.name || ''}
                onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={editedContact.phone || ''}
                onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={editedContact.email || ''}
                onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="WhatsApp"
                value={editedContact.whatsapp || ''}
                onChange={(e) => setEditedContact({ ...editedContact, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleUpdateContact}
                disabled={updateContactMutation.isPending}
                className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {updateContactMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {contact.name && (
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2">{contact.name}</span>
                </div>
              )}
              {contact.phone && (
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <span className="ml-2">{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2">{contact.email}</span>
                </div>
              )}
              {contact.whatsapp && (
                <div>
                  <span className="text-gray-500">WhatsApp:</span>
                  <span className="ml-2">{contact.whatsapp}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div>
          <h3 className="font-semibold mb-3">Notes</h3>

          {/* Add Note Form */}
          <div className="mb-4 space-y-2">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={isPrivateNote}
                  onChange={(e) => setIsPrivateNote(e.target.checked)}
                  className="rounded"
                />
                Private note
              </label>
              <button
                onClick={handleAddNote}
                disabled={!noteContent.trim() || createNoteMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {notes?.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg ${
                  note.isPrivate ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.isPrivate ? (
                      <Lock className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">
                      {note.user.name || note.user.email}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                <span className="text-xs text-gray-500">
                  {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}