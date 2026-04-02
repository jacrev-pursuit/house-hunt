"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ScoreRing from "@/components/ScoreRing";
import { calculateScore, getCombinedScore } from "@/lib/scoring";
import { formatFullPrice, formatDate, tourStatusLabel, tourStatusColor } from "@/lib/utils";
import Link from "next/link";

interface HouseDetail {
  house: {
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
    photos: Array<{ id: string; url: string; source: string; caption: string }>;
    evaluations: Array<{ id: string; houseId: string; userId: string; priorityId: string; met: string; notes: string }>;
    houseNotes: Array<{
      id: string;
      userId: string;
      sentiment: string;
      text: string;
      createdAt: string;
      user: { id: string; name: string };
    }>;
  };
  parents: Array<{
    id: string;
    name: string;
    priorities: Array<{ id: string; name: string; category: string; rank: number; userId: string; createdAt: string }>;
  }>;
}

export default function HouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<HouseDetail | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSentiment, setNoteSentiment] = useState("neutral");

  const fetchHouse = useCallback(async () => {
    const res = await fetch(`/api/houses/${params.id}`);
    if (!res.ok) { router.push("/houses"); return; }
    setData(await res.json());
  }, [params.id, router]);

  useEffect(() => { fetchHouse(); }, [fetchHouse]);

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sand-400">Loading...</div>
      </div>
    );
  }

  const { house, parents } = data;
  const photos = house.photos;

  const parentScores = parents.map((parent) => {
    const evals = house.evaluations.filter((e) => e.userId === parent.id);
    return {
      parent,
      score: calculateScore(parent.priorities, evals as never[]),
    };
  });
  const combinedScore = getCombinedScore(parentScores.map((ps) => ps.score));

  async function handleDeleteHouse() {
    if (!confirm("Delete this house? This cannot be undone.")) return;
    await fetch(`/api/houses/${house.id}`, { method: "DELETE" });
    router.push("/houses");
  }

  async function submitNote() {
    if (!noteText.trim()) return;
    await fetch(`/api/houses/${house.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: noteText, sentiment: noteSentiment }),
    });
    setNoteText("");
    setShowNoteForm(false);
    fetchHouse();
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        await fetch(`/api/houses/${house.id}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: base64, source: "upload", caption: "" }),
        });
        fetchHouse();
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="pb-4">
      {/* Photo carousel */}
      <div className="relative h-64 bg-sand-200">
        {photos.length > 0 ? (
          <>
            <img
              src={photos[photoIdx]?.url}
              alt={house.address}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIdx((i) => (i > 0 ? i - 1 : photos.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd"/>
                  </svg>
                </button>
                <button
                  onClick={() => setPhotoIdx((i) => (i < photos.length - 1 ? i + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                  </svg>
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                  {photoIdx + 1} / {photos.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sand-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5" />
            </svg>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/>
          </svg>
        </button>

        {/* Status badge */}
        <div className="absolute top-4 right-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tourStatusColor(house.tourStatus)}`}>
            {tourStatusLabel(house.tourStatus)}
          </span>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-xl font-bold text-foreground">{house.address}</h1>
          {house.neighborhood && (
            <p className="text-sm text-sand-400 mt-0.5">{house.neighborhood}</p>
          )}
          <p className="text-2xl font-bold text-slate-blue mt-1">
            {house.price > 0 ? formatFullPrice(house.price) : "Price TBD"}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 py-3 border-y border-sand-200 text-sm">
          {house.beds > 0 && (
            <div className="text-center">
              <div className="font-bold text-foreground">{house.beds}</div>
              <div className="text-xs text-sand-400">Beds</div>
            </div>
          )}
          {house.baths > 0 && (
            <div className="text-center">
              <div className="font-bold text-foreground">{house.baths}</div>
              <div className="text-xs text-sand-400">Baths</div>
            </div>
          )}
          {house.sqft > 0 && (
            <div className="text-center">
              <div className="font-bold text-foreground">{house.sqft.toLocaleString()}</div>
              <div className="text-xs text-sand-400">Sq Ft</div>
            </div>
          )}
          {house.lotAcres > 0 && (
            <div className="text-center">
              <div className="font-bold text-foreground">{house.lotAcres}</div>
              <div className="text-xs text-sand-400">Acres</div>
            </div>
          )}
          {house.yearBuilt > 0 && (
            <div className="text-center">
              <div className="font-bold text-foreground">{house.yearBuilt}</div>
              <div className="text-xs text-sand-400">Built</div>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="bg-white rounded-2xl border border-sand-200 p-4">
          <h2 className="font-semibold text-sm text-foreground mb-3">Match Scores</h2>
          <div className="flex items-center justify-around">
            {parentScores.map(({ parent, score }) => (
              <ScoreRing
                key={parent.id}
                score={score.score}
                size={72}
                strokeWidth={5}
                label={parent.name}
                showDealbreaker={score.hasDealbreaker}
              />
            ))}
            <ScoreRing
              score={combinedScore}
              size={72}
              strokeWidth={5}
              label="Combined"
            />
          </div>
          {parentScores.some((ps) => ps.score.hasDealbreaker) && (
            <p className="text-xs text-red-500 text-center mt-3 font-medium">
              Has unmet must-haves
            </p>
          )}
        </div>

        {/* Score breakdown */}
        {parentScores.map(({ parent, score }) => (
          score.breakdown.length > 0 && (
            <details key={parent.id} className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
              <summary className="px-4 py-3 cursor-pointer flex items-center justify-between">
                <span className="font-semibold text-sm">{parent.name}&apos;s Evaluation</span>
                <span className="text-sm text-sand-400">
                  {score.score}%
                  {score.mustHavesTotal > 0 && ` (${score.mustHavesMet}/${score.mustHavesTotal} must-haves)`}
                </span>
              </summary>
              <div className="px-4 pb-3 space-y-1.5">
                {score.breakdown.map(({ priority, met, points, maxPoints }) => (
                  <div key={priority.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      met === "yes" ? "bg-emerald-100 text-emerald-600" :
                      met === "partial" ? "bg-amber-100 text-amber-600" :
                      met === "no" ? "bg-red-100 text-red-600" :
                      "bg-sand-100 text-sand-400"
                    }`}>
                      {met === "yes" ? "✓" : met === "partial" ? "½" : met === "no" ? "✗" : "?"}
                    </span>
                    <span className="flex-1">{priority.name}</span>
                    <span className={`text-xs font-mono ${priority.category === "must_have" ? "text-red-500" : "text-sand-400"}`}>
                      {points}/{maxPoints}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )
        ))}

        {/* Action buttons for parents */}
        {user?.role === "parent" && (
          <div className="flex gap-2">
            <Link
              href={`/houses/${house.id}/evaluate`}
              className="flex-1 py-3 rounded-xl bg-sea-green text-white text-center font-semibold text-sm hover:bg-sea-green-light transition-colors"
            >
              Evaluate
            </Link>
            <Link
              href={`/houses/${house.id}/edit`}
              className="flex-1 py-3 rounded-xl bg-sand-200 text-foreground text-center font-semibold text-sm hover:bg-sand-300 transition-colors"
            >
              Edit
            </Link>
          </div>
        )}

        {/* Photo upload */}
        {user?.role === "parent" && (
          <div>
            <label className="block w-full py-3 rounded-xl border-2 border-dashed border-sand-200 text-sand-400 text-center text-sm cursor-pointer hover:border-slate-blue hover:text-slate-blue transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              + Upload Tour Photos
            </label>
          </div>
        )}

        {/* Tour date */}
        {house.tourDate && (
          <div className="flex items-center gap-2 text-sm text-sand-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
            </svg>
            Tour: {formatDate(house.tourDate)}
          </div>
        )}

        {/* Listing link */}
        {house.listingUrl && (
          <a
            href={house.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-3 rounded-xl bg-sand-100 text-slate-blue text-center text-sm font-medium hover:bg-sand-200 transition-colors"
          >
            View Original Listing →
          </a>
        )}

        {/* Description */}
        {house.description && (
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Description</h3>
            <p className="text-sm text-sand-400 leading-relaxed">{house.description}</p>
          </div>
        )}

        {/* Notes */}
        {house.notes && (
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-1">General Notes</h3>
            <p className="text-sm text-sand-400 leading-relaxed">{house.notes}</p>
          </div>
        )}

        {/* Family notes / reactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground">Reactions</h3>
            {user?.role === "parent" && (
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="text-xs text-slate-blue font-medium"
              >
                + Add Note
              </button>
            )}
          </div>

          {showNoteForm && (
            <div className="space-y-2 mb-3">
              <div className="flex gap-2">
                {[
                  { value: "like", label: "👍 Like", color: "bg-emerald-100 text-emerald-700" },
                  { value: "dislike", label: "👎 Dislike", color: "bg-red-100 text-red-700" },
                  { value: "neutral", label: "🤔 Note", color: "bg-sand-100 text-sand-500" },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setNoteSentiment(s.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                      noteSentiment === s.value ? s.color + " ring-2 ring-offset-1 ring-current" : "bg-sand-50 text-sand-400"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What did you think?"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20 resize-none"
              />
              <button
                onClick={submitNote}
                disabled={!noteText.trim()}
                className="w-full py-2 rounded-xl bg-slate-blue text-white text-sm font-medium disabled:opacity-40"
              >
                Save Note
              </button>
            </div>
          )}

          {house.houseNotes.length > 0 ? (
            <div className="space-y-2">
              {house.houseNotes.map((note) => (
                <div key={note.id} className="bg-white rounded-xl border border-sand-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">
                      {note.sentiment === "like" ? "👍" : note.sentiment === "dislike" ? "👎" : "🤔"}
                    </span>
                    <span className="font-medium text-sm">{note.user.name}</span>
                    <span className="text-xs text-sand-300 ml-auto">{formatDate(note.createdAt)}</span>
                  </div>
                  <p className="text-sm text-sand-400">{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-sand-300 text-center py-4">No reactions yet</p>
          )}
        </div>

        {/* Delete button */}
        {user?.role === "parent" && (
          <button
            onClick={handleDeleteHouse}
            className="w-full py-2 text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            Delete this house
          </button>
        )}
      </div>
    </div>
  );
}
