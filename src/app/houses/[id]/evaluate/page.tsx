"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Priority {
  id: string;
  name: string;
  category: string;
  rank: number;
  parentName: string;
}

interface Evaluation {
  priorityId: string;
  met: string;
  notes: string;
}

export default function EvaluatePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, Evaluation>>(new Map());
  const [houseName, setHouseName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/houses/${params.id}`);
    if (!res.ok) { router.push("/houses"); return; }
    const data = await res.json();
    setHouseName(data.house.address);

    const allPriorities: Priority[] = [];
    for (const parent of data.parents) {
      for (const p of parent.priorities) {
        allPriorities.push({ ...p, parentName: parent.name });
      }
    }
    setPriorities(allPriorities);

    const existingEvals = new Map<string, Evaluation>();
    for (const ev of data.house.evaluations) {
      existingEvals.set(ev.priorityId, {
        priorityId: ev.priorityId,
        met: ev.met,
        notes: ev.notes,
      });
    }
    setEvaluations(existingEvals);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleMet(priorityId: string) {
    setEvaluations((prev) => {
      const next = new Map(prev);
      const current = next.get(priorityId);
      const cycle = ["not_evaluated", "yes", "partial", "no"];
      const currentMet = current?.met || "not_evaluated";
      const nextIdx = (cycle.indexOf(currentMet) + 1) % cycle.length;
      next.set(priorityId, {
        priorityId,
        met: cycle[nextIdx],
        notes: current?.notes || "",
      });
      return next;
    });
  }

  function updateNote(priorityId: string, notes: string) {
    setEvaluations((prev) => {
      const next = new Map(prev);
      const current = next.get(priorityId);
      next.set(priorityId, {
        priorityId,
        met: current?.met || "not_evaluated",
        notes,
      });
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const evList = Array.from(evaluations.values()).filter(
        (ev) => ev.met !== "not_evaluated"
      );

      const res = await fetch(`/api/houses/${params.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluations: evList }),
      });

      if (res.ok) {
        router.push(`/houses/${params.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sand-400">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "parent") {
    return (
      <div className="p-6 text-center text-sand-400">
        Only parents can evaluate houses.
      </div>
    );
  }

  const parentNames = [...new Set(priorities.map((p) => p.parentName))];
  const mustHaves = priorities.filter((p) => p.category === "must_have");
  const niceToHaves = priorities.filter((p) => p.category === "nice_to_have");

  return (
    <div className="p-4 space-y-5">
      <header className="pt-2">
        <button onClick={() => router.back()} className="text-slate-blue text-sm font-medium mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/>
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-foreground">Evaluate</h1>
        <p className="text-sm text-sand-400 mt-1 truncate">{houseName}</p>
        <p className="text-xs text-sand-300 mt-0.5">
          Combined priorities from {parentNames.join(" & ")}
        </p>
      </header>

      <p className="text-xs text-sand-400 bg-sand-100 rounded-xl px-3 py-2">
        Tap each priority to cycle: <span className="text-sand-500">Not evaluated</span> → <span className="text-emerald-600">Met</span> → <span className="text-amber-500">Partial</span> → <span className="text-red-500">Not met</span>
      </p>

      {mustHaves.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
            Must-Haves
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{mustHaves.length}</span>
          </h2>
          <div className="space-y-2">
            {mustHaves.map((p) => (
              <EvalRow
                key={p.id}
                priority={p}
                evaluation={evaluations.get(p.id)}
                onToggle={() => toggleMet(p.id)}
                onNoteChange={(notes) => updateNote(p.id, notes)}
              />
            ))}
          </div>
        </div>
      )}

      {niceToHaves.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
            Nice-to-Haves
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{niceToHaves.length}</span>
          </h2>
          <div className="space-y-2">
            {niceToHaves.map((p) => (
              <EvalRow
                key={p.id}
                priority={p}
                evaluation={evaluations.get(p.id)}
                onToggle={() => toggleMet(p.id)}
                onNoteChange={(notes) => updateNote(p.id, notes)}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-xl bg-sea-green text-white font-semibold hover:bg-sea-green-light active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Evaluation"}
      </button>
    </div>
  );
}

function EvalRow({
  priority,
  evaluation,
  onToggle,
  onNoteChange,
}: {
  priority: Priority;
  evaluation?: Evaluation;
  onToggle: () => void;
  onNoteChange: (notes: string) => void;
}) {
  const met = evaluation?.met || "not_evaluated";
  const [showNote, setShowNote] = useState(!!evaluation?.notes);

  const statusConfig = {
    not_evaluated: { bg: "bg-sand-100", text: "text-sand-400", icon: "?", label: "Not evaluated" },
    yes: { bg: "bg-emerald-100", text: "text-emerald-600", icon: "✓", label: "Met" },
    partial: { bg: "bg-amber-100", text: "text-amber-600", icon: "½", label: "Partial" },
    no: { bg: "bg-red-100", text: "text-red-600", icon: "✗", label: "Not met" },
  }[met] || { bg: "bg-sand-100", text: "text-sand-400", icon: "?", label: "Not evaluated" };

  return (
    <div className="bg-white rounded-xl border border-sand-200 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-3">
        <button
          onClick={onToggle}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${statusConfig.bg} ${statusConfig.text} active:scale-90 transition-transform`}
        >
          {statusConfig.icon}
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{priority.name}</div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs ${statusConfig.text}`}>{statusConfig.label}</span>
            <span className="text-xs text-sand-300">· {priority.parentName}</span>
          </div>
        </div>
        <button
          onClick={() => setShowNote(!showNote)}
          className="text-sand-300 hover:text-slate-blue p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </button>
      </div>
      {showNote && (
        <div className="px-3 pb-3">
          <input
            value={evaluation?.notes || ""}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Add a note..."
            className="w-full px-3 py-2 rounded-lg border border-sand-200 bg-sand-50 text-sm focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
