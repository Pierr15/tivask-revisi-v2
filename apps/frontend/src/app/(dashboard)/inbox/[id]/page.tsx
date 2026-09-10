"use client";

import { useEffect, useState } from 'react';
import { fetchClient } from '@/lib/apiClient';

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await fetchClient(`/conversations/${params.id}`);
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await fetchClient(`/conversations/${params.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText })
      });
      setReplyText('');
      fetchData();
    } catch (err: any) {
      alert('Error sending reply: ' + err.message);
    }
  };

  const handleResolve = async () => {
    if (!data?.pendingEscalationId) return;
    try {
      await fetchClient(`/escalations/${data.pendingEscalationId}/resolve`, {
        method: 'POST'
      });
      fetchData();
    } catch (err: any) {
      alert('Error resolving: ' + err.message);
    }
  };

  if (loading && !data) return <div className="p-4">Loading...</div>;
  if (!data) return <div className="p-4">Not found</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{data.conversation.contactName || data.conversation.contactPhone}</h2>
          <p className="text-sm text-gray-500">{data.conversation.contactPhone} - Status: <span className="font-semibold">{data.conversation.status}</span></p>
        </div>
        {data.conversation.status === 'escalated' && data.pendingEscalationId && (
          <button 
            onClick={handleResolve}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Mark as Resolved
          </button>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {data.messages.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-gray-100 text-gray-900' : 'bg-blue-100 text-blue-900'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className="flex items-center justify-between mt-1 text-xs text-gray-500 gap-4">
                <span>{msg.sender}</span>
                <span>{new Date(msg.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleReply} className="flex gap-2">
          <input 
            type="text" 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={data.conversation.status !== 'escalated'}
            placeholder={data.conversation.status === 'escalated' ? "Type a reply..." : "Wait for an escalation to reply"}
            className="flex-1 px-4 py-2 border rounded-md disabled:bg-gray-100"
          />
          <button 
            type="submit"
            disabled={data.conversation.status !== 'escalated' || !replyText.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
