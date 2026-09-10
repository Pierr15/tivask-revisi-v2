"use client";

import { useEffect, useState } from 'react';
import { fetchClient } from '@/lib/apiClient';
import Link from 'next/link';

interface ConversationSummary {
  id: string;
  contactPhone: string;
  contactName: string | null;
  status: string;
  lastMessageAt: string;
  pendingEscalationId: string | null;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const { data } = await fetchClient('/conversations');
      setConversations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inbox & Escalations</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {loading && conversations.length === 0 ? (
            <li className="p-4 text-center text-gray-500">Loading...</li>
          ) : conversations.length === 0 ? (
            <li className="p-4 text-center text-gray-500">No conversations found</li>
          ) : (
            conversations.map((conv) => (
              <li key={conv.id} className="p-4 hover:bg-gray-50">
                <Link href={`/inbox/${conv.id}`} className="flex justify-between items-center w-full">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {conv.contactName || conv.contactPhone}
                    </h3>
                    <p className="text-sm text-gray-500">{conv.contactPhone}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                      {new Date(conv.lastMessageAt).toLocaleString()}
                    </span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      conv.status === 'escalated' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
