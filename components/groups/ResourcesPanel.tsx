"use client";

import { useState } from "react";
import type { Resource, ResourceWithUser } from "@/lib/supabase/types";

const CATEGORY_ICON: Record<Resource["category"], { icon: string; color: string; label: string }> = {
  doc:   { icon: "D", color: "bg-blue-100 text-blue-700",   label: "Doc"   },
  sheet: { icon: "S", color: "bg-green-100 text-green-700", label: "Sheet" },
  slide: { icon: "P", color: "bg-yellow-100 text-yellow-700", label: "Slide" },
  pdf:   { icon: "PDF", color: "bg-red-100 text-red-700",   label: "PDF"   },
  link:  { icon: "↗", color: "bg-gray-100 text-gray-600",   label: "Link"  },
};

interface Props {
  groupId: string;
  initialResources: ResourceWithUser[];
  currentUserId: string;
  isOwner: boolean;
}

export default function ResourcesPanel({ groupId, initialResources, currentUserId, isOwner }: Props) {
  const [resources, setResources] = useState<ResourceWithUser[]>(initialResources);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim() || adding) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), url: url.trim(), description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResources((prev) => [data.resource, ...prev]);
      setTitle(""); setUrl(""); setDescription(""); setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add resource");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(resourceId: string) {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    await fetch(`/api/groups/${groupId}/resources/${resourceId}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Resources</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ Add resource"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Brief"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL *</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/..."
              type="url"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note about this resource"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!title.trim() || !url.trim() || adding}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {adding ? "Adding…" : "Add Resource"}
          </button>
        </form>
      )}

      {resources.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No resources yet. Add a Google Doc, PDF, or any link your group needs.
        </div>
      )}

      <div className="space-y-2">
        {resources.map((r) => {
          const cat = CATEGORY_ICON[r.category];
          const canDelete = r.created_by === currentUserId || isOwner;
          return (
            <div key={r.id} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-indigo-200 transition-colors group">
              <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${cat.color}`}>
                {cat.icon}
              </span>
              <div className="flex-1 min-w-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate block"
                >
                  {r.title}
                </a>
                {r.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{r.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.users?.full_name ?? r.users?.email?.split("@")[0] ?? "Unknown"} · {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </div>
              {canDelete && (
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none flex-shrink-0 mt-0.5"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
