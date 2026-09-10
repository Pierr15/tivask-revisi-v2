"use client";

import { useEffect, useState } from "react";
import { fetchClient } from "@/lib/apiClient";

interface KbEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  isActive: boolean;
  validUntil: string | null;
}

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "",
    content: "",
    keywords: "",
    validUntil: "",
    isActive: true,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      await fetchClient("/knowledge-base", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          content: form.content,

          keywords: form.keywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean),

          validUntil: form.validUntil || null,
          isActive: form.isActive,
        }),
      });

      setShowAddModal(false);

      setForm({
        title: "",
        category: "",
        content: "",
        keywords: "",
        validUntil: "",
        isActive: true,
      });

      await fetchEntries();
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan data.");
    } finally {
      setSaving(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchEntries = async () => {
    try {
      const { data } = await fetchClient("/knowledge-base");
      setEntries(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <div>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Add Knowledge Base
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Tambahkan informasi baru untuk sumber jawaban TIVAsk.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 p-6">
              {formError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Title
                </label>

                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Biaya Seragam TJKT"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Category
                </label>

                <input
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="Contoh: biaya"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Keywords
                </label>

                <input
                  value={form.keywords}
                  onChange={(e) =>
                    setForm({ ...form, keywords: e.target.value })
                  }
                  placeholder="seragam, biaya, tjkt"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Pisahkan keyword menggunakan koma.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Content
                </label>

                <textarea
                  required
                  rows={8}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="Masukkan informasi lengkap..."
                  className="w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Valid Until
                </label>

                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm({ ...form, validUntil: e.target.value })
                  }
                  className="rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isActive: e.target.checked,
                    })
                  }
                />

                <span className="text-sm text-gray-700">Aktifkan entry</span>
              </label>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Entry
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No entries found
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {entry.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {entry.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {entry.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-blue-600 hover:text-blue-900 cursor-pointer">
                    Edit
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
