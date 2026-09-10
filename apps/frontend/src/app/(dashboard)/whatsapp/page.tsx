"use client";

import { useEffect, useState } from "react";
import { fetchClient } from "@/lib/apiClient";

export default function WhatsappPage() {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await fetchClient("/whatsapp/status");
      setStatusData(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetchClient("/whatsapp/logout", { method: "POST" });
      fetchStatus();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">WhatsApp Connection</h1>

      <div className="bg-white p-6 rounded-lg shadow max-w-md">
        {loading && !statusData ? (
          <p className="text-gray-500">Loading status...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p
                className={`text-lg font-bold capitalize ${
                  statusData?.status === "connected"
                    ? "text-green-600"
                    : statusData?.status === "pairing"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {statusData?.status || "Unknown"}
              </p>
            </div>

            {statusData?.status === "connected" && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Connected Number
                </p>
                <p className="text-lg font-semibold">
                  {statusData?.phoneNumber || "Unknown"}
                </p>
              </div>
            )}

            {statusData?.status === "pairing" && statusData?.qrDataUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Scan QR Code
                </p>
                <img
                  src={statusData.qrDataUrl}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 border rounded-md"
                />
              </div>
            )}

            {statusData?.status === "connected" && (
              <button
                onClick={handleLogout}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Disconnect
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
