"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import ScoreRing from "@/components/ScoreRing";
import Link from "next/link";
import { formatPrice, tourStatusLabel, tourStatusColor, formatDateShort } from "@/lib/utils";
import { calculateScore, getCombinedScore } from "@/lib/scoring";

interface DashData {
  houses: Array<{
    id: string;
    address: string;
    neighborhood: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
    tourDate: string | null;
    tourStatus: string;
    createdAt: string;
    photos: Array<{ url: string }>;
    evaluations: Array<{ userId: string; priorityId: string; met: string }>;
  }>;
  parents: Array<{
    id: string;
    name: string;
    priorities: Array<{ id: string; userId: string; name: string; category: string; rank: number; createdAt: string }>;
  }>;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashData | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/houses");
    setData(await res.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sand-400">Loading...</div>
      </div>
    );
  }

  const { houses, parents } = data;

  // Stats
  const totalHouses = houses.length;
  const visited = houses.filter((h) => h.tourStatus === "visited").length;
  const upcoming = houses.filter((h) => h.tourStatus === "upcoming").length;

  // Top scored houses
  const scoredHouses = houses.map((house) => {
    const scores = parents.map((parent) => {
      const evals = house.evaluations.filter((e) => e.userId === parent.id);
      return calculateScore(parent.priorities, evals as never[]);
    });
    return { house, combined: getCombinedScore(scores), scores };
  });

  const topHouses = scoredHouses
    .filter((h) => h.combined > 0)
    .sort((a, b) => b.combined - a.combined)
    .slice(0, 3);

  const nextTour = houses
    .filter((h) => h.tourStatus === "upcoming" && h.tourDate)
    .sort((a, b) => new Date(a.tourDate!).getTime() - new Date(b.tourDate!).getTime())[0];

  const recentlyAdded = houses
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">North Fork</h1>
          <p className="text-sm text-sand-400">
            Welcome back, {user?.name}
          </p>
        </div>
        <button
          onClick={logout}
          className="text-xs text-sand-400 hover:text-coral px-3 py-1.5 rounded-lg bg-sand-100"
        >
          Sign Out
        </button>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-sand-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-blue">{totalHouses}</div>
          <div className="text-xs text-sand-400 mt-0.5">Properties</div>
        </div>
        <div className="bg-white rounded-2xl border border-sand-200 p-4 text-center">
          <div className="text-2xl font-bold text-sea-green">{visited}</div>
          <div className="text-xs text-sand-400 mt-0.5">Visited</div>
        </div>
        <div className="bg-white rounded-2xl border border-sand-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">{upcoming}</div>
          <div className="text-xs text-sand-400 mt-0.5">Upcoming</div>
        </div>
      </div>

      {/* Next Tour */}
      {nextTour && (
        <Link href={`/houses/${nextTour.id}`} className="block">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
              </svg>
              <span className="text-sm font-semibold text-amber-700">Next Tour</span>
            </div>
            <p className="font-bold text-foreground">{nextTour.address}</p>
            <p className="text-sm text-amber-600 mt-1">{formatDateShort(nextTour.tourDate)}</p>
          </div>
        </Link>
      )}

      {/* Top Matches */}
      {topHouses.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3">Top Matches</h2>
          <div className="space-y-3">
            {topHouses.map(({ house, combined, scores }) => (
              <Link key={house.id} href={`/houses/${house.id}`} className="block">
                <div className="bg-white rounded-2xl border border-sand-200 p-3 flex items-center gap-3 active:scale-[0.98] transition-transform">
                  <div className="w-16 h-16 rounded-xl bg-sand-200 overflow-hidden flex-shrink-0">
                    {house.photos[0] ? (
                      <img src={house.photos[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sand-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{house.address}</p>
                    <p className="text-sm text-slate-blue font-bold">{formatPrice(house.price)}</p>
                    <div className="flex gap-3 mt-1 text-xs text-sand-400">
                      {scores.map((s, i) => (
                        <span key={i}>{parents[i]?.name}: {s.score}%</span>
                      ))}
                    </div>
                  </div>
                  <ScoreRing score={combined} size={48} strokeWidth={4} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Recently Added</h2>
            <Link href="/houses" className="text-xs text-slate-blue font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentlyAdded.map((house) => (
              <Link key={house.id} href={`/houses/${house.id}`} className="block">
                <div className="flex items-center gap-3 bg-white rounded-xl border border-sand-200 p-3 active:scale-[0.98] transition-transform">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{house.address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tourStatusColor(house.tourStatus)}`}>
                        {tourStatusLabel(house.tourStatus)}
                      </span>
                      {house.price > 0 && (
                        <span className="text-xs text-sand-400">{formatPrice(house.price)}</span>
                      )}
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-sand-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {houses.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sand-100 text-sand-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">Start your house hunt</h3>
          <p className="text-sm text-sand-400 mb-4">
            {user?.role === "parent"
              ? "Add your first property to get started"
              : "Mom & Dad haven't added any houses yet"}
          </p>
          {user?.role === "parent" && (
            <div className="space-y-2">
              <Link
                href="/priorities"
                className="block py-2 text-sm text-slate-blue font-medium"
              >
                Set up your priorities first →
              </Link>
              <Link
                href="/houses/new"
                className="block py-3 mx-auto max-w-xs rounded-xl bg-sea-green text-white font-semibold text-sm"
              >
                Add a House
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
