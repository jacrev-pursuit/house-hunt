"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
  const [houses, setHouses] = useState<HouseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/houses");
    const data = await res.json();
    setHouses(data.houses);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const interested = houses.filter((h) => h.tourStatus === "interested");
  const skipped = houses.filter((h) => h.tourStatus === "skipped");

  return (
    <div className="p-4 space-y-6">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-foreground">Tour Schedule</h1>
        <p className="text-sm text-sand-400 mt-1">
          {upcoming.length} upcoming {upcoming.length === 1 ? "tour" : "tours"}
        </p>
      </header>

      {/* Upcoming tours */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Upcoming Tours
          </h2>
          <div className="space-y-2">
            {upcoming.map((house) => {
              const tourDate = new Date(house.tourDate!);
              const isToday = tourDate.toDateString() === now.toDateString();
              const isTomorrow = tourDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();

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
      {skipped.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            Passed ({skipped.length})
          </h2>
          <div className="space-y-2">
            {skipped.map((house) => (
              <ScheduleRow key={house.id} house={house} />
            ))}
          </div>
        </div>
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
