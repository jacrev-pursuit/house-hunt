"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

interface Priority {
  id: string;
  userId: string;
  name: string;
  category: string;
  rank: number;
}

interface Parent {
  id: string;
  name: string;
  priorities: Priority[];
}

export default function PrioritiesPage() {
  const { user } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"must_have" | "nice_to_have">("must_have");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const isParent = user?.role === "parent";

  const fetchPriorities = useCallback(async () => {
    const res = await fetch("/api/priorities");
    const data = await res.json();
    setParents(data.parents);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  const myPriorities = parents.find((p) => p.id === user?.id)?.priorities || [];
  const otherParent = parents.find((p) => p.id !== user?.id && p.priorities);

  const mustHaves = myPriorities.filter((p) => p.category === "must_have");
  const niceToHaves = myPriorities.filter((p) => p.category === "nice_to_have");

  async function addPriority(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    await fetch("/api/priorities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), category: newCategory }),
    });
    setNewName("");
    fetchPriorities();
  }

  async function deletePriority(id: string) {
    await fetch("/api/priorities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPriorities();
  }

  async function toggleCategory(priority: Priority) {
    const newCat = priority.category === "must_have" ? "nice_to_have" : "must_have";
    const updated = myPriorities.map((p) =>
      p.id === priority.id ? { ...p, category: newCat } : p
    );
    // Re-rank within each category
    const musts = updated.filter((p) => p.category === "must_have");
    const nices = updated.filter((p) => p.category === "nice_to_have");
    const reranked = [...musts, ...nices].map((p, i) => ({ ...p, rank: i + 1 }));

    setSaving(true);
    await fetch("/api/priorities", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priorities: reranked }),
    });
    setSaving(false);
    fetchPriorities();
  }

  async function moveItem(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const items = [...myPriorities];
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    const reranked = items.map((p, i) => ({ ...p, rank: i + 1 }));

    // Optimistic update
    setParents((prev) =>
      prev.map((parent) =>
        parent.id === user?.id ? { ...parent, priorities: reranked } : parent
      )
    );

    await fetch("/api/priorities", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priorities: reranked }),
    });
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      moveItem(dragIdx, idx);
      setDragIdx(idx);
    }
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  // Touch-based reorder
  function moveUp(idx: number) {
    if (idx > 0) moveItem(idx, idx - 1);
  }

  function moveDown(idx: number) {
    if (idx < myPriorities.length - 1) moveItem(idx, idx + 1);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sand-400">Loading priorities...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-foreground">Priorities</h1>
        <p className="text-sm text-sand-400 mt-1">
          {isParent
            ? "Rank what matters most in your new home"
            : "See what matters most to Mom & Dad"}
        </p>
      </header>

      {isParent && (
        <>
          {/* Add new priority */}
          <form onSubmit={addPriority} className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a priority..."
              className="flex-1 px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as "must_have" | "nice_to_have")}
              className="px-2 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none"
            >
              <option value="must_have">Must</option>
              <option value="nice_to_have">Nice</option>
            </select>
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-blue text-white text-sm font-medium disabled:opacity-40"
            >
              Add
            </button>
          </form>

          {/* My priorities */}
          <PrioritySection
            title="Must-Haves"
            description="Dealbreakers if not met"
            priorities={mustHaves}
            allPriorities={myPriorities}
            color="bg-red-50 border-red-200"
            badgeColor="bg-red-100 text-red-700"
            onToggle={toggleCategory}
            onDelete={deletePriority}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            dragIdx={dragIdx}
            saving={saving}
          />

          <PrioritySection
            title="Nice-to-Haves"
            description="Would love, but flexible"
            priorities={niceToHaves}
            allPriorities={myPriorities}
            color="bg-blue-50 border-blue-200"
            badgeColor="bg-blue-100 text-blue-700"
            onToggle={toggleCategory}
            onDelete={deletePriority}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            dragIdx={dragIdx}
            saving={saving}
          />

          {/* Scoring preview */}
          {myPriorities.length > 0 && (
            <div className="bg-sand-100 rounded-2xl p-4">
              <h3 className="font-semibold text-sm text-foreground mb-2">How scoring works</h3>
              <div className="space-y-1 text-xs text-sand-400">
                <p>Higher ranked = more points when a house meets it</p>
                <p>Must-haves get <strong className="text-red-600">2x</strong> weight</p>
                <p>Nice-to-haves get <strong className="text-blue-600">1x</strong> weight</p>
                <p>Unmet must-haves trigger a dealbreaker warning</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Other parent's priorities (read-only) */}
      {otherParent && otherParent.priorities.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">
            {otherParent.name}&apos;s Priorities
          </h2>
          <div className="space-y-2">
            {otherParent.priorities.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-sand-200"
              >
                <span className="text-xs font-mono text-sand-300 w-5 text-right">
                  {p.rank}
                </span>
                <span className="flex-1 text-sm">{p.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    p.category === "must_have"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {p.category === "must_have" ? "Must" : "Nice"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PrioritySection({
  title,
  description,
  priorities,
  allPriorities,
  color,
  badgeColor,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDragEnd,
  dragIdx,
  saving,
}: {
  title: string;
  description: string;
  priorities: Priority[];
  allPriorities: Priority[];
  color: string;
  badgeColor: string;
  onToggle: (p: Priority) => void;
  onDelete: (id: string) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onDragStart: (idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDragEnd: () => void;
  dragIdx: number | null;
  saving: boolean;
}) {
  if (priorities.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-bold text-foreground">{title}</h2>
          <p className="text-xs text-sand-400">{description}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}>
          {priorities.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {priorities.map((p) => {
          const globalIdx = allPriorities.findIndex((ap) => ap.id === p.id);
          return (
            <div
              key={p.id}
              draggable
              onDragStart={() => onDragStart(globalIdx)}
              onDragOver={(e) => onDragOver(e, globalIdx)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white transition-all ${
                dragIdx === globalIdx ? "opacity-50 scale-95" : ""
              } ${color.includes("red") ? "border-red-100" : "border-blue-100"}`}
            >
              {/* Drag handle + rank */}
              <div className="flex items-center gap-1 text-sand-300 cursor-grab active:cursor-grabbing">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                  <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                  <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                </svg>
                <span className="text-xs font-mono w-4 text-right">{p.rank}</span>
              </div>

              <span className="flex-1 text-sm font-medium">{p.name}</span>

              {/* Mobile reorder buttons */}
              <div className="flex flex-col -my-1">
                <button
                  onClick={() => onMoveUp(globalIdx)}
                  disabled={globalIdx === 0 || saving}
                  className="text-sand-300 hover:text-slate-blue disabled:opacity-20 p-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd"/>
                  </svg>
                </button>
                <button
                  onClick={() => onMoveDown(globalIdx)}
                  disabled={globalIdx === allPriorities.length - 1 || saving}
                  className="text-sand-300 hover:text-slate-blue disabled:opacity-20 p-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              {/* Toggle category */}
              <button
                onClick={() => onToggle(p)}
                disabled={saving}
                className={`text-xs px-2 py-0.5 rounded-full ${badgeColor} hover:opacity-80`}
              >
                {p.category === "must_have" ? "Must" : "Nice"}
              </button>

              {/* Delete */}
              <button
                onClick={() => onDelete(p.id)}
                className="text-sand-300 hover:text-red-500 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
