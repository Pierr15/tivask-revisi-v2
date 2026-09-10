"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  MessageSquare,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";

import { fetchClient } from "@/lib/apiClient";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    knowledgeBase: 0,
    conversations: 0,
    escalated: 0,
    whatsappStatus: "loading",
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [kbResponse, conversationResponse, whatsappResponse] =
          await Promise.all([
            fetchClient("/knowledge-base"),
            fetchClient("/conversations"),
            fetchClient("/whatsapp/status"),
          ]);

        const conversations = conversationResponse.data ?? [];

        setStats({
          knowledgeBase: kbResponse.data?.length ?? 0,
          conversations: conversations.length,
          escalated: conversations.filter(
            (conversation: any) => conversation.status === "escalated",
          ).length,
          whatsappStatus: whatsappResponse.status ?? "disconnected",
        });
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    {
      title: "Knowledge Base",
      value: stats.knowledgeBase,
      description: "Informasi aktif untuk bot",
      icon: BookOpen,
    },
    {
      title: "Percakapan",
      value: stats.conversations,
      description: "Total percakapan pengguna",
      icon: MessageSquare,
    },
    {
      title: "Escalation",
      value: stats.escalated,
      description: "Butuh penanganan admin",
      icon: AlertTriangle,
    },
    {
      title: "WhatsApp",
      value:
        stats.whatsappStatus === "connected" ? "Connected" : "Disconnected",
      description: "Status koneksi bot",
      icon: MessageCircle,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-600">Admin Dashboard</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          Overview
        </h1>

        <p className="mt-2 text-gray-500">
          Pantau layanan TIVAsk dan kelola informasi bot dari satu tempat.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-500">{card.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">TIVAsk System</h2>

        <p className="mt-1 text-sm text-gray-500">
          Sistem admin sudah terhubung dengan layanan backend TIVAsk.
        </p>
      </div>
    </div>
  );
}
