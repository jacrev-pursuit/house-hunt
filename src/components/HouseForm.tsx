"use client";

import { useState } from "react";

interface HouseFormData {
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
  tourDate: string;
  tourStatus: string;
  notes: string;
  photoUrls: string[];
}

interface HouseFormProps {
  initial?: Partial<HouseFormData>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

export default function HouseForm({ initial, onSave, saving }: HouseFormProps) {
  const [form, setForm] = useState<HouseFormData>({
    address: initial?.address || "",
    neighborhood: initial?.neighborhood || "",
    price: initial?.price || 0,
    beds: initial?.beds || 0,
    baths: initial?.baths || 0,
    sqft: initial?.sqft || 0,
    lotAcres: initial?.lotAcres || 0,
    yearBuilt: initial?.yearBuilt || 0,
    listingUrl: initial?.listingUrl || "",
    description: initial?.description || "",
    tourDate: initial?.tourDate || "",
    tourStatus: initial?.tourStatus || "interested",
    notes: initial?.notes || "",
    photoUrls: initial?.photoUrls || [],
  });
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");

  function update(field: keyof HouseFormData, value: string | number | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleScrape() {
    if (!form.listingUrl) return;
    setScraping(true);
    setScrapeError("");

    try {
      const res = await fetch("/api/scrape-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.listingUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        setScrapeError(err.error || "Could not fetch listing");
        return;
      }

      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        address: data.address || prev.address,
        neighborhood: data.neighborhood || prev.neighborhood,
        price: data.price || prev.price,
        beds: data.beds || prev.beds,
        baths: data.baths || prev.baths,
        sqft: data.sqft || prev.sqft,
        lotAcres: data.lotAcres || prev.lotAcres,
        yearBuilt: data.yearBuilt || prev.yearBuilt,
        description: data.description || prev.description,
        photoUrls: data.photoUrls?.length ? data.photoUrls : prev.photoUrls,
      }));
      if (data._hint) {
        setScrapeError(data._hint);
      }
    } catch {
      setScrapeError("Failed to fetch listing. Try entering details manually.");
    } finally {
      setScraping(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(form as unknown as Record<string, unknown>);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Listing URL with auto-fill */}
      <div className="bg-slate-blue/5 rounded-2xl p-4 space-y-3">
        <label className="block text-sm font-semibold text-foreground">
          Listing URL
        </label>
        <div className="flex gap-2">
          <input
            value={form.listingUrl}
            onChange={(e) => update("listingUrl", e.target.value)}
            placeholder="Paste Zillow, Redfin, or Realtor.com link"
            className="flex-1 px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
          />
          <button
            type="button"
            onClick={handleScrape}
            disabled={!form.listingUrl || scraping}
            className="px-4 py-2.5 rounded-xl bg-slate-blue text-white text-sm font-medium disabled:opacity-40 whitespace-nowrap"
          >
            {scraping ? "Loading..." : "Auto-fill"}
          </button>
        </div>
        {scrapeError && (
          <p className="text-xs text-coral">{scrapeError}</p>
        )}
        {form.photoUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-1">
            {form.photoUrls.slice(0, 5).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Listing photo ${i + 1}`}
                className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Address *</label>
        <input
          required
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="123 Main St, Greenport, NY"
          className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Neighborhood</label>
        <input
          value={form.neighborhood}
          onChange={(e) => update("neighborhood", e.target.value)}
          placeholder="Greenport, Southold, Mattituck..."
          className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-sand-400 mb-1">Price</label>
          <input
            type="number"
            value={form.price || ""}
            onChange={(e) => update("price", parseInt(e.target.value) || 0)}
            placeholder="850000"
            className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sand-400 mb-1">Beds</label>
          <input
            type="number"
            value={form.beds || ""}
            onChange={(e) => update("beds", parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sand-400 mb-1">Baths</label>
          <input
            type="number"
            step="0.5"
            value={form.baths || ""}
            onChange={(e) => update("baths", parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sand-400 mb-1">Sq Ft</label>
          <input
            type="number"
            value={form.sqft || ""}
            onChange={(e) => update("sqft", parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sand-400 mb-1">Lot (acres)</label>
          <input
            type="number"
            step="0.01"
            value={form.lotAcres || ""}
            onChange={(e) => update("lotAcres", parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sand-400 mb-1">Year Built</label>
          <input
            type="number"
            value={form.yearBuilt || ""}
            onChange={(e) => update("yearBuilt", parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
          />
        </div>
      </div>

      {/* Tour info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-sand-400 mb-1">Tour Date</label>
          <input
            type="date"
            value={form.tourDate}
            onChange={(e) => update("tourDate", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sand-400 mb-1">Status</label>
          <select
            value={form.tourStatus}
            onChange={(e) => update("tourStatus", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none"
          >
            <option value="interested">Interested</option>
            <option value="upcoming">Tour Scheduled</option>
            <option value="visited">Visited</option>
            <option value="offer_made">Offer Made</option>
            <option value="under_contract">Under Contract</option>
            <option value="passed">Passed</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Any initial thoughts..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !form.address}
        className="w-full py-3.5 rounded-xl bg-sea-green text-white font-semibold hover:bg-sea-green-light active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save House"}
      </button>
    </form>
  );
}
