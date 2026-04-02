"use client";

import { useState, useRef, useCallback } from "react";

const SUGGESTED_PRIORITIES = [
  "Pool",
  "Big yard",
  "Privacy",
  "Close to town",
  "Close to beach",
  "Lots of bathrooms",
  "Space to spread out",
  "5 true beds",
  "Good basement",
  "New kitchen/bathrooms",
  "No work required",
  "Charm",
];

type Category = "must_have" | "nice_to_have" | "dont_care";

interface PriorityItem {
  name: string;
  category: Category;
}

interface PrioritySetupProps {
  userName: string;
  onComplete: () => void;
}

export default function PrioritySetup({ userName, onComplete }: PrioritySetupProps) {
  const [items, setItems] = useState<PriorityItem[]>(
    SUGGESTED_PRIORITIES.map((name) => ({ name, category: "dont_care" }))
  );
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragState, setDragState] = useState<{
    idx: number;
    startY: number;
    currentY: number;
    itemHeight: number;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const musts = items.filter((i) => i.category === "must_have");
  const nices = items.filter((i) => i.category === "nice_to_have");
  const dontCare = items.filter((i) => i.category === "dont_care");
  const saveable = musts.length + nices.length;

  function cycleCategory(name: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.name !== name) return item;
        const order: Category[] = ["dont_care", "nice_to_have", "must_have"];
        const nextIdx = (order.indexOf(item.category) + 1) % order.length;
        return { ...item, category: order[nextIdx] };
      })
    );
  }

  function setCategory(name: string, category: Category) {
    setItems((prev) =>
      prev.map((item) => (item.name === name ? { ...item, category } : item))
    );
  }

  function addCustom(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed || items.some((i) => i.name === trimmed)) return;
    setItems((prev) => [...prev, { name: trimmed, category: "dont_care" }]);
    setCustomName("");
  }

  // --- Drag-to-reorder within a category ---

  const getItemsForCategory = useCallback(
    (cat: Category) => items.filter((i) => i.category === cat),
    [items]
  );

  function handlePointerDown(e: React.PointerEvent, globalIdx: number) {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const rect = target.getBoundingClientRect();
    setDragState({
      idx: globalIdx,
      startY: e.clientY,
      currentY: e.clientY,
      itemHeight: rect.height + 6,
    });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState) return;
    setDragState((prev) => (prev ? { ...prev, currentY: e.clientY } : null));

    const deltaY = e.clientY - dragState.startY;
    const slots = Math.round(deltaY / dragState.itemHeight);
    if (slots === 0) return;

    const draggedItem = items[dragState.idx];
    const catItems = getItemsForCategory(draggedItem.category);
    const catIdx = catItems.indexOf(draggedItem);
    const targetCatIdx = catIdx + slots;

    if (targetCatIdx < 0 || targetCatIdx >= catItems.length) return;

    setItems((prev) => {
      const next = [...prev];
      const globalFrom = dragState.idx;
      const targetItem = catItems[targetCatIdx];
      const globalTo = next.indexOf(targetItem);
      const [moved] = next.splice(globalFrom, 1);
      next.splice(globalTo, 0, moved);
      return next;
    });

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            idx: items.indexOf(draggedItem) + (slots > 0 ? 1 : -1) * Math.abs(slots),
            startY: prev.startY + slots * prev.itemHeight,
          }
        : null
    );
  }

  function handlePointerUp() {
    setDragState(null);
  }

  async function handleSave() {
    if (saveable === 0) return;
    setSaving(true);
    try {
      const toSave = [...musts, ...nices];
      for (const item of toSave) {
        await fetch("/api/priorities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: item.name, category: item.category }),
        });
      }
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  function moveWithinCategory(cat: Category, fromCatIdx: number, toCatIdx: number) {
    if (fromCatIdx === toCatIdx) return;
    setItems((prev) => {
      const next = [...prev];
      const catItems = next.filter((i) => i.category === cat);
      const item = catItems[fromCatIdx];
      const targetItem = catItems[toCatIdx];
      const globalFrom = next.indexOf(item);
      const globalTo = next.indexOf(targetItem);
      next.splice(globalFrom, 1);
      next.splice(globalTo, 0, item);
      return next;
    });
  }

  return (
    <div className="p-4 space-y-5 pb-36">
      <header className="pt-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">Hi {userName}!</h1>
        <p className="text-sm text-sand-400 mt-1">
          Tap each priority to classify it. Drag to rank within each group.
        </p>
      </header>

      {/* Must-Haves */}
      <CategorySection
        title="Must-Haves"
        subtitle="Dealbreakers if not met"
        color="red"
        items={musts}
        allItems={items}
        category="must_have"
        dragState={dragState}
        onCycleCategory={cycleCategory}
        onSetCategory={setCategory}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMove={moveWithinCategory}
        listRef={listRef}
        itemRefs={itemRefs}
      />

      {/* Nice-to-Haves */}
      <CategorySection
        title="Nice-to-Haves"
        subtitle="Would love, but flexible"
        color="blue"
        items={nices}
        allItems={items}
        category="nice_to_have"
        dragState={dragState}
        onCycleCategory={cycleCategory}
        onSetCategory={setCategory}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMove={moveWithinCategory}
        listRef={listRef}
        itemRefs={itemRefs}
      />

      {/* Don't Care */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-bold text-sand-400 text-sm">Don&apos;t Care</h2>
          <span className="text-xs text-sand-300">({dontCare.length})</span>
        </div>
        {dontCare.length === 0 ? (
          <p className="text-xs text-sand-300 py-3 text-center">
            All priorities classified — nice!
          </p>
        ) : (
          <div className="space-y-1.5">
            {dontCare.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-sand-200 bg-sand-50"
              >
                <span className="flex-1 text-sm text-sand-400">{item.name}</span>
                <button
                  onClick={() => setCategory(item.name, "nice_to_have")}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium active:scale-95"
                >
                  Nice
                </button>
                <button
                  onClick={() => setCategory(item.name, "must_have")}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium active:scale-95"
                >
                  Must
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add custom */}
      <form onSubmit={addCustom} className="flex gap-2">
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Add your own..."
          className="flex-1 px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
        />
        <button
          type="submit"
          disabled={!customName.trim()}
          className="px-4 py-2.5 rounded-xl bg-sand-200 text-sand-500 text-sm font-medium disabled:opacity-40"
        >
          + Add
        </button>
      </form>

      {/* Save */}
      <div className="fixed bottom-16 inset-x-0 z-40 bg-sand-50/95 backdrop-blur-sm pt-3 pb-3 px-4 border-t border-sand-200">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-sand-400">
              {musts.length > 0 && <span className="text-red-600 font-medium">{musts.length} must-haves</span>}
              {musts.length > 0 && nices.length > 0 && " · "}
              {nices.length > 0 && <span className="text-blue-600 font-medium">{nices.length} nice-to-haves</span>}
              {saveable === 0 && "Tap items above to classify them"}
            </div>
            <p className="text-xs text-sand-300">You can change these later</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveable === 0 || saving}
            className="w-full py-3 rounded-xl bg-sea-green text-white font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {saving ? "Saving..." : `Save ${saveable} Priorities`}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Sortable category section ---

function CategorySection({
  title,
  subtitle,
  color,
  items,
  allItems,
  category,
  dragState,
  onCycleCategory,
  onSetCategory,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onMove,
}: {
  title: string;
  subtitle: string;
  color: "red" | "blue";
  items: PriorityItem[];
  allItems: PriorityItem[];
  category: Category;
  dragState: { idx: number; startY: number; currentY: number; itemHeight: number } | null;
  onCycleCategory: (name: string) => void;
  onSetCategory: (name: string, cat: Category) => void;
  onPointerDown: (e: React.PointerEvent, globalIdx: number) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onMove: (cat: Category, from: number, to: number) => void;
  listRef: React.RefObject<HTMLDivElement | null>;
  itemRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
}) {
  const borderColor = color === "red" ? "border-red-100" : "border-blue-100";
  const bgColor = color === "red" ? "bg-red-50/50" : "bg-blue-50/50";
  const badgeBg = color === "red" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700";
  const headerColor = color === "red" ? "text-red-700" : "text-blue-700";
  const rankBg = color === "red" ? "bg-red-600" : "bg-slate-blue";

  if (items.length === 0) {
    return (
      <div className={`rounded-2xl border-2 border-dashed ${color === "red" ? "border-red-200" : "border-blue-200"} p-4`}>
        <h2 className={`font-bold text-sm ${headerColor}`}>{title}</h2>
        <p className="text-xs text-sand-300 mt-1">{subtitle}</p>
        <p className="text-xs text-sand-300 mt-2 text-center py-2">
          Tap &ldquo;{color === "red" ? "Must" : "Nice"}&rdquo; on items below to add them here
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className={`font-bold text-sm ${headerColor}`}>{title}</h2>
          <p className="text-xs text-sand-300">{subtitle}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeBg}`}>
          {items.length}
        </span>
      </div>
      <div className={`rounded-2xl ${bgColor} p-2 space-y-1.5`}>
        {items.map((item, catIdx) => {
          const globalIdx = allItems.indexOf(item);
          const isDragging = dragState?.idx === globalIdx;
          const offset = isDragging ? dragState.currentY - dragState.startY : 0;

          return (
            <div
              key={item.name}
              style={isDragging ? { transform: `translateY(${offset}px)`, zIndex: 50 } : undefined}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white transition-shadow ${borderColor} ${
                isDragging ? "shadow-lg opacity-90" : ""
              }`}
            >
              {/* Drag handle */}
              <div
                className="touch-none cursor-grab active:cursor-grabbing text-sand-300 p-1 -ml-1"
                onPointerDown={(e) => onPointerDown(e, globalIdx)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                  <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                  <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                </svg>
              </div>

              {/* Rank number */}
              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${rankBg}`}>
                {catIdx + 1}
              </span>

              <span className="flex-1 text-sm font-medium text-foreground">{item.name}</span>

              {/* Up/down fallback */}
              <div className="flex flex-col -my-1">
                <button
                  onClick={() => onMove(category, catIdx, catIdx - 1)}
                  disabled={catIdx === 0}
                  className="text-sand-300 hover:text-slate-blue disabled:opacity-20 p-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd"/>
                  </svg>
                </button>
                <button
                  onClick={() => onMove(category, catIdx, catIdx + 1)}
                  disabled={catIdx === items.length - 1}
                  className="text-sand-300 hover:text-slate-blue disabled:opacity-20 p-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              {/* Demote button */}
              <button
                onClick={() => onSetCategory(item.name, "dont_care")}
                className="text-sand-300 hover:text-red-500 p-0.5"
                title="Remove from list"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
