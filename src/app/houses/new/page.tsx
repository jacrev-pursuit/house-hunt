"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HouseForm from "@/components/HouseForm";

export default function NewHousePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch("/api/houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { house } = await res.json();
        router.push(`/houses/${house.id}`);
      }
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-2xl font-bold text-foreground">Add House</h1>
      </header>
      <HouseForm onSave={handleSave} saving={saving} />
    </div>
  );
}
