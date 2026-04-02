"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ScoreRing from "@/components/ScoreRing";
import { calculateScore, getCombinedScore } from "@/lib/scoring";
import { formatPrice } from "@/lib/utils";

interface HouseForCompare {
  id: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lotAcres: number;
  yearBuilt: number;
  tourStatus: string;
  photos: Array<{ url: string }>;
  evaluations: Array<{ userId: string; priorityId: string; met: string }>;
}

interface Parent {
  id: string;
  name: string;
  priorities: Array<{ id: string; userId: string; name: string; category: string; rank: number; createdAt: string }>;
}

export default function ComparePage() {
  const [houses, setHouses] = useState<HouseForCompare[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/houses");
    const data = await res.json();
    setHouses(data.houses);
    setParents(data.parents);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sand-400">Loading...</div>
      </div>
    );
  }

  const selectedHouses = selected.map((id) => houses.find((h) => h.id === id)!).filter(Boolean);

  const scoredSelected = selectedHouses.map((house) => {
    const scores = parents.map((parent) => {
      const evals = house.evaluations.filter((e) => e.userId === parent.id);
      return { parent, score: calculateScore(parent.priorities, evals as never[]) };
    });
    return { house, scores, combined: getCombinedScore(scores.map((s) => s.score)) };
  });

  // Collect all priority names from all parents for comparison
  const allPriorityNames = new Map<string, { name: string; category: string }>();
  for (const parent of parents) {
    for (const p of parent.priorities) {
      if (!allPriorityNames.has(p.name)) {
        allPriorityNames.set(p.name, { name: p.name, category: p.category });
      }
    }
  }

  return (
    <div className="p-4 space-y-5">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-foreground">Compare</h1>
        <p className="text-sm text-sand-400 mt-1">
          Select up to 3 houses to compare side by side
        </p>
      </header>

      {/* House selector */}
      <div className="space-y-2">
        {houses.map((house) => {
          const isSelected = selected.includes(house.id);
          return (
            <button
              key={house.id}
              onClick={() => toggleSelect(house.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left ${
                isSelected
                  ? "bg-slate-blue/5 border-slate-blue"
                  : "bg-white border-sand-200"
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? "border-slate-blue bg-slate-blue text-white" : "border-sand-300"
              }`}>
                {isSelected && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{house.address}</p>
                <p className="text-xs text-sand-400">{house.price > 0 ? formatPrice(house.price) : "Price TBD"}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Comparison table */}
      {selectedHouses.length >= 2 && (
        <div className="space-y-4">
          <h2 className="font-bold text-foreground">Comparison</h2>

          {/* Scores */}
          <div className="bg-white rounded-2xl border border-sand-200 p-4">
            <h3 className="font-semibold text-sm mb-3">Match Scores</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-1 text-xs text-sand-400 font-medium" />
                    {scoredSelected.map(({ house }) => (
                      <th key={house.id} className="text-center py-1 px-2">
                        <Link href={`/houses/${house.id}`} className="text-xs font-medium text-slate-blue hover:underline truncate block max-w-[100px]">
                          {house.address.split(",")[0]}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parents.map((parent) => (
                    <tr key={parent.id}>
                      <td className="py-2 text-xs text-sand-400">{parent.name}</td>
                      {scoredSelected.map(({ house, scores }) => {
                        const ps = scores.find((s) => s.parent.id === parent.id);
                        return (
                          <td key={house.id} className="text-center py-2">
                            <div className="flex justify-center">
                              <ScoreRing score={ps?.score.score || 0} size={40} strokeWidth={3} />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-t border-sand-200">
                    <td className="py-2 text-xs font-semibold">Combined</td>
                    {scoredSelected.map(({ house, combined }) => (
                      <td key={house.id} className="text-center py-2">
                        <div className="flex justify-center">
                          <ScoreRing score={combined} size={48} strokeWidth={4} />
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key stats */}
          <div className="bg-white rounded-2xl border border-sand-200 p-4">
            <h3 className="font-semibold text-sm mb-3">Key Stats</h3>
            <div className="space-y-3">
              {[
                { label: "Price", render: (h: HouseForCompare) => h.price > 0 ? formatPrice(h.price) : "—" },
                { label: "Beds", render: (h: HouseForCompare) => h.beds > 0 ? String(h.beds) : "—" },
                { label: "Baths", render: (h: HouseForCompare) => h.baths > 0 ? String(h.baths) : "—" },
                { label: "Sq Ft", render: (h: HouseForCompare) => h.sqft > 0 ? h.sqft.toLocaleString() : "—" },
                { label: "Lot (acres)", render: (h: HouseForCompare) => h.lotAcres > 0 ? String(h.lotAcres) : "—" },
                { label: "Year Built", render: (h: HouseForCompare) => h.yearBuilt > 0 ? String(h.yearBuilt) : "—" },
              ].map(({ label, render }) => (
                <div key={label} className="flex items-center">
                  <span className="w-24 text-xs text-sand-400 flex-shrink-0">{label}</span>
                  {selectedHouses.map((house) => (
                    <span key={house.id} className="flex-1 text-center text-sm font-medium">
                      {render(house)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Priority coverage */}
          <div className="bg-white rounded-2xl border border-sand-200 p-4">
            <h3 className="font-semibold text-sm mb-3">Priority Coverage</h3>
            <div className="space-y-2">
              {Array.from(allPriorityNames.values()).map(({ name, category }) => (
                <div key={name} className="flex items-center">
                  <span className="w-32 text-xs flex-shrink-0 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${category === "must_have" ? "bg-red-400" : "bg-blue-400"}`} />
                    <span className="truncate">{name}</span>
                  </span>
                  {scoredSelected.map(({ house, scores }) => {
                    let met = "not_evaluated";
                    for (const { parent, score } of scores) {
                      const item = score.breakdown.find((b) => b.priority.name === name);
                      if (item) { met = item.met; break; }
                    }
                    return (
                      <span key={house.id} className="flex-1 text-center">
                        <span className={`inline-block w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                          met === "yes" ? "bg-emerald-100 text-emerald-600" :
                          met === "partial" ? "bg-amber-100 text-amber-600" :
                          met === "no" ? "bg-red-100 text-red-600" :
                          "bg-sand-100 text-sand-400"
                        }`}>
                          {met === "yes" ? "✓" : met === "partial" ? "½" : met === "no" ? "✗" : "—"}
                        </span>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedHouses.length < 2 && houses.length >= 2 && (
        <p className="text-center text-sm text-sand-400 py-8">
          Select at least 2 houses to compare
        </p>
      )}

      {houses.length < 2 && (
        <p className="text-center text-sm text-sand-400 py-8">
          Add at least 2 houses to use the comparison feature
        </p>
      )}
    </div>
  );
}
