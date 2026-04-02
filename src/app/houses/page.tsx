"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import HouseCard from "@/components/HouseCard";
import Link from "next/link";

type HouseData = {
  houses: Array<{
    id: string;
    address: string;
    neighborhood: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
    lotAcres: number;
    yearBuilt: number;
    listingUrl: string;
    description: string;
    tourDate: string | null;
    tourStatus: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    photos: Array<{ id: string; url: string; source: string; caption: string; houseId: string; createdAt: string }>;
    evaluations: Array<{ id: string; houseId: string; userId: string; priorityId: string; met: string; notes: string; createdAt: string; updatedAt: string }>;
  }>;
  parents: Array<{
    id: string;
    name: string;
    role: string;
    passcode: string;
    createdAt: string;
    priorities: Array<{ id: string; userId: string; name: string; category: string; rank: number; createdAt: string }>;
  }>;
};

export default function HousesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<HouseData | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");

  const fetchHouses = useCallback(async () => {
    const res = await fetch("/api/houses");
    const json = await res.json();
    setData(json);
  }, []);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sand-400">Loading houses...</div>
      </div>
    );
  }

  let houses = [...data.houses];

  // Filter
  if (filter !== "all") {
    houses = houses.filter((h) => h.tourStatus === filter);
  }

  // Sort
  if (sort === "score") {
    // We'll sort by some basic heuristic (evaluated count)
    houses.sort((a, b) => b.evaluations.length - a.evaluations.length);
  } else if (sort === "price_asc") {
    houses.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    houses.sort((a, b) => b.price - a.price);
  } else if (sort === "tour") {
    houses.sort((a, b) => {
      if (!a.tourDate) return 1;
      if (!b.tourDate) return -1;
      return new Date(a.tourDate).getTime() - new Date(b.tourDate).getTime();
    });
  } else {
    houses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Houses</h1>
          <p className="text-sm text-sand-400">{data.houses.length} properties</p>
        </div>
        {data.houses.length >= 2 && (
          <Link
            href="/compare"
            className="px-3 py-1.5 rounded-lg bg-sand-100 text-slate-blue text-sm font-medium hover:bg-sand-200 transition-colors"
          >
            Compare
          </Link>
        )}
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { value: "all", label: "All" },
          { value: "interested", label: "Interested" },
          { value: "upcoming", label: "Scheduled" },
          { value: "visited", label: "Visited" },
          { value: "skipped", label: "Passed" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? "bg-slate-blue text-white"
                : "bg-sand-100 text-sand-400 hover:bg-sand-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none"
      >
        <option value="newest">Newest first</option>
        <option value="score">Most evaluated</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="tour">Tour date</option>
      </select>

      {/* House cards */}
      <div className="space-y-4">
        {houses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-sand-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
              </svg>
            </div>
            <p className="text-sand-400 font-medium">No houses yet</p>
            {user?.role === "parent" && (
              <p className="text-sm text-sand-300 mt-1">Add your first property to get started</p>
            )}
          </div>
        )}
        {houses.map((house) => (
          <HouseCard key={house.id} house={house as never} parents={data.parents as never[]} />
        ))}
      </div>

      {/* FAB */}
      {user?.role === "parent" && (
        <Link
          href="/houses/new"
          className="fixed bottom-24 right-4 w-14 h-14 bg-sea-green text-white rounded-full shadow-lg flex items-center justify-center hover:bg-sea-green-light active:scale-95 transition-all z-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </Link>
      )}
    </div>
  );
}
