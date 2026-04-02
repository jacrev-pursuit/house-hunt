"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import HouseForm from "@/components/HouseForm";

export default function EditHousePage() {
  const params = useParams();
  const router = useRouter();
  const [house, setHouse] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchHouse = useCallback(async () => {
    const res = await fetch(`/api/houses/${params.id}`);
    if (!res.ok) { router.push("/houses"); return; }
    const data = await res.json();
    setHouse(data.house);
  }, [params.id, router]);

  useEffect(() => { fetchHouse(); }, [fetchHouse]);

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    try {
      await fetch(`/api/houses/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      router.push(`/houses/${params.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (!house) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sand-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <header className="pt-2 mb-6">
        <button onClick={() => router.back()} className="text-slate-blue text-sm font-medium mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/>
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-foreground">Edit House</h1>
      </header>
      <HouseForm
        initial={{
          address: house.address as string,
          neighborhood: house.neighborhood as string,
          price: house.price as number,
          beds: house.beds as number,
          baths: house.baths as number,
          sqft: house.sqft as number,
          lotAcres: house.lotAcres as number,
          yearBuilt: house.yearBuilt as number,
          listingUrl: house.listingUrl as string,
          description: house.description as string,
          tourDate: house.tourDate ? new Date(house.tourDate as string).toISOString().split("T")[0] : "",
          tourStatus: house.tourStatus as string,
          notes: house.notes as string,
        }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
