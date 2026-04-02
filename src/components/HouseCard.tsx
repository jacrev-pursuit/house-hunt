"use client";

import Link from "next/link";
import ScoreRing from "./ScoreRing";
import StatusPicker from "./StatusPicker";
import { formatPrice, formatDateShort } from "@/lib/utils";
import { calculateScore, getCombinedScore } from "@/lib/scoring";
import { useAuth } from "./AuthProvider";
import type { House, HousePhoto, HouseEvaluation, Priority, User } from "@/generated/prisma/client";

interface HouseWithRelations extends House {
  photos: HousePhoto[];
  evaluations: HouseEvaluation[];
}

interface ParentWithPriorities extends User {
  priorities: Priority[];
}

interface HouseCardProps {
  house: HouseWithRelations;
  parents: ParentWithPriorities[];
  onStatusChange?: () => void;
}

export default function HouseCard({ house, parents, onStatusChange }: HouseCardProps) {
  const { user } = useAuth();
  const isParent = user?.role === "parent";

  const scores = parents.map((parent) => {
    const parentPriorityIds = new Set(parent.priorities.map((p) => p.id));
    const evals = house.evaluations.filter((e) => parentPriorityIds.has(e.priorityId));
    return calculateScore(parent.priorities, evals);
  });
  const combined = getCombinedScore(scores);
  const hasDealbreaker = scores.some((s) => s.hasDealbreaker);
  const heroMedia = house.photos[0];
  const heroPhoto = heroMedia?.url;
  const heroIsVideo = heroMedia?.mediaType === "video";

  async function handleStatusChange(newStatus: string) {
    await fetch(`/api/houses/${house.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourStatus: newStatus }),
    });
    onStatusChange?.();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
      <Link href={`/houses/${house.id}`} className="block">
        {/* Hero image */}
        <div className="relative h-44 bg-sand-200">
          {heroPhoto ? (
            heroIsVideo ? (
              <video
                src={heroPhoto}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={heroPhoto}
                alt={house.address}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sand-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
              </svg>
            </div>
          )}
          {heroIsVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          )}
          {hasDealbreaker && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Dealbreaker
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/houses/${house.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{house.address}</h3>
            {house.neighborhood && (
              <p className="text-sm text-sand-400 mt-0.5">{house.neighborhood}</p>
            )}
            <p className="text-lg font-bold text-slate-blue mt-1">
              {house.price > 0 ? formatPrice(house.price) : "Price TBD"}
            </p>
          </Link>
          <ScoreRing score={combined} size={52} strokeWidth={4} />
        </div>

        {/* Stats + Status row */}
        <div className="flex items-center gap-4 mt-3 text-sm text-sand-400">
          {house.beds > 0 && <span>{house.beds} bd</span>}
          {house.baths > 0 && <span>{house.baths} ba</span>}
          {house.sqft > 0 && <span>{house.sqft.toLocaleString()} sqft</span>}
          {house.tourDate && (
            <span className="text-xs">
              Tour: {formatDateShort(house.tourDate)}
            </span>
          )}
          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            <StatusPicker
              currentStatus={house.tourStatus}
              onStatusChange={handleStatusChange}
              disabled={!isParent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
