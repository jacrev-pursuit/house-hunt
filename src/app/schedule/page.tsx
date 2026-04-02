"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { formatDate, tourStatusLabel, tourStatusColor, formatPrice } from "@/lib/utils";

interface HouseSummary {
  id: string;
  address: string;
  neighborhood: string;
  price: number;
  tourDate: string | null;
  tourStatus: string;
  photos: Array<{ url: string }>;
}

export default function SchedulePage() {
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const [houses, setHouses] = useState<HouseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedHouseId, setSelectedHouseId] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/houses");
    const data = await res.json();
    setHouses(data.houses);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function scheduleTour() {
    if (!selectedHouseId || !tourDate) return;
    setSaving(true);
    await fetch(`/api/houses/${selectedHouseId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourStatus: "upcoming", tourDate }),
    });
    setSelectedHouseId("");
    setTourDate("");
    setShowScheduleForm(false);
    setSaving(false);
    fetchData();
  }

  async function quickScheduleNew() {
    setShowScheduleForm(true);
    setSelectedHouseId("");
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sand-400">Loading schedule...</div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = houses
    .filter((h) => h.tourStatus === "upcoming" && h.tourDate)
    .sort((a, b) => new Date(a.tourDate!).getTime() - new Date(b.tourDate!).getTime());

  const visited = houses
    .filter((h) => h.tourStatus === "visited")
    .sort((a, b) => {
      if (!a.tourDate || !b.tourDate) return 0;
      return new Date(b.tourDate).getTime() - new Date(a.tourDate).getTime();
    });

  const inNegotiation = houses.filter((h) =>
    ["offer_made", "under_contract"].includes(h.tourStatus)
  );

  const schedulable = houses.filter((h) =>
    h.tourStatus === "interested" || (h.tourStatus === "visited" && !h.tourDate)
  );

  const interested = houses.filter((h) => h.tourStatus === "interested");
  const passed = houses.filter((h) => ["passed", "skipped", "rejected", "withdrawn"].includes(h.tourStatus));

  return (
    <div className="p-4 space-y-6">
      <header className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tour Schedule</h1>
          <p className="text-sm text-sand-400 mt-1">
            {upcoming.length} upcoming {upcoming.length === 1 ? "tour" : "tours"}
          </p>
        </div>
        {isParent && (
          <button
            onClick={quickScheduleNew}
            className="px-3 py-1.5 rounded-lg bg-sea-green text-white text-sm font-medium hover:bg-sea-green-light active:scale-95 transition-all"
          >
            + Schedule Tour
          </button>
        )}
      </header>

      {/* Quick schedule form */}
      {showScheduleForm && (
        <div className="bg-white rounded-2xl border border-sand-200 p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Schedule a Tour</h3>
          
          {schedulable.length > 0 ? (
            <div>
              <label className="text-xs text-sand-400 mb-1 block">Pick a house</label>
              <select
                value={selectedHouseId}
                onChange={(e) => setSelectedHouseId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
              >
                <option value="">Select a property...</option>
                {schedulable.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.address} {h.price > 0 && `(${formatPrice(h.price)})`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-sm text-sand-400 bg-sand-50 rounded-xl p-3">
              No houses to schedule. <Link href="/houses/new" className="text-slate-blue font-medium">Add one first</Link>.
            </div>
          )}

          <div>
            <label className="text-xs text-sand-400 mb-1 block">Tour date & time</label>
            <input
              type="datetime-local"
              value={tourDate}
              onChange={(e) => setTourDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={scheduleTour}
              disabled={!selectedHouseId || !tourDate || saving}
              className="flex-1 py-2.5 rounded-xl bg-sea-green text-white text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {saving ? "Scheduling..." : "Schedule"}
            </button>
            <button
              onClick={() => setShowScheduleForm(false)}
              className="px-4 py-2.5 rounded-xl bg-sand-100 text-sand-500 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* In negotiation */}
      {inNegotiation.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            In Negotiation ({inNegotiation.length})
          </h2>
          <div className="space-y-2">
            {inNegotiation.map((house) => (
              <ScheduleRow key={house.id} house={house} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming tours */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Upcoming Tours
          </h2>
          <div className="space-y-2">
            {upcoming.map((house) => {
              const tourDateObj = new Date(house.tourDate!);
              const isToday = tourDateObj.toDateString() === now.toDateString();
              const isTomorrow = tourDateObj.toDateString() === new Date(now.getTime() + 86400000).toDateString();

              return (
                <Link key={house.id} href={`/houses/${house.id}`} className="block">
                  <div className={`rounded-2xl border p-4 active:scale-[0.98] transition-transform ${
                    isToday ? "bg-amber-50 border-amber-300" : "bg-white border-sand-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-sand-200 overflow-hidden flex-shrink-0">
                        {house.photos[0] ? (
                          <img src={house.photos[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sand-300 text-lg">🏠</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{house.address}</p>
                        <p className="text-xs text-sand-400">
                          {house.neighborhood && `${house.neighborhood} · `}
                          {house.price > 0 && formatPrice(house.price)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isToday ? "text-amber-600" : "text-foreground"}`}>
                          {isToday ? "Today" : isTomorrow ? "Tomorrow" : formatDate(house.tourDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Visited */}
      {visited.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Visited ({visited.length})
          </h2>
          <div className="space-y-2">
            {visited.map((house) => (
              <ScheduleRow key={house.id} house={house} />
            ))}
          </div>
        </div>
      )}

      {/* Interested */}
      {interested.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Need to Schedule ({interested.length})
          </h2>
          <div className="space-y-2">
            {interested.map((house) => (
              <ScheduleRow key={house.id} house={house} />
            ))}
          </div>
        </div>
      )}

      {/* Passed */}
      {passed.length > 0 && (
        <details className="group">
          <summary className="font-bold text-foreground mb-3 flex items-center gap-2 cursor-pointer list-none">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            Passed / Rejected ({passed.length})
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-sand-300 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </summary>
          <div className="space-y-2">
            {passed.map((house) => (
              <ScheduleRow key={house.id} house={house} />
            ))}
          </div>
        </details>
      )}

      {houses.length === 0 && (
        <div className="text-center py-16 text-sand-400">
          <p className="font-medium">No houses yet</p>
          <p className="text-sm mt-1">Add some properties to see them here</p>
        </div>
      )}
    </div>
  );
}

function ScheduleRow({ house }: { house: HouseSummary }) {
  return (
    <Link href={`/houses/${house.id}`} className="block">
      <div className="flex items-center gap-3 bg-white rounded-xl border border-sand-200 p-3 active:scale-[0.98] transition-transform">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{house.address}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${tourStatusColor(house.tourStatus)}`}>
              {tourStatusLabel(house.tourStatus)}
            </span>
            {house.tourDate && (
              <span className="text-xs text-sand-300">{formatDate(house.tourDate)}</span>
            )}
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-sand-300" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
      </div>
    </Link>
  );
}
