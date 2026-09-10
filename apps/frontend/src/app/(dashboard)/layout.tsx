"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchClient } from '@/lib/apiClient';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetchClient('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">TIVAsk Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/whatsapp" 
            className={`block p-2 rounded ${pathname.includes('/whatsapp') ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            WhatsApp Status
          </Link>
          <Link 
            href="/knowledge-base" 
            className={`block p-2 rounded ${pathname.includes('/knowledge-base') ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            Knowledge Base
          </Link>
          <Link 
            href="/inbox" 
            className={`block p-2 rounded ${pathname.includes('/inbox') ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            Inbox & Escalations
          </Link>
        </nav>
        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="w-full text-left p-2 hover:bg-gray-100 rounded text-red-600"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
