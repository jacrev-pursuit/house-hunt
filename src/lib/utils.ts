export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(0)}K`;
  }
  return `$${price}`;
}

export function formatFullPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const ALL_STATUSES = [
  "interested",
  "upcoming",
  "visited",
  "offer_made",
  "under_contract",
  "passed",
  "rejected",
  "withdrawn",
] as const;

export type HouseStatus = (typeof ALL_STATUSES)[number];

export function tourStatusLabel(status: string): string {
  const map: Record<string, string> = {
    interested: "Interested",
    upcoming: "Tour Scheduled",
    visited: "Visited",
    offer_made: "Offer Made",
    under_contract: "Under Contract",
    passed: "Passed",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    skipped: "Passed",
  };
  return map[status] || status;
}

export function tourStatusColor(status: string): string {
  const map: Record<string, string> = {
    interested: "bg-blue-100 text-blue-700",
    upcoming: "bg-amber-100 text-amber-700",
    visited: "bg-emerald-100 text-emerald-700",
    offer_made: "bg-purple-100 text-purple-700",
    under_contract: "bg-indigo-100 text-indigo-700",
    passed: "bg-gray-100 text-gray-500",
    rejected: "bg-red-100 text-red-600",
    withdrawn: "bg-orange-100 text-orange-600",
    skipped: "bg-gray-100 text-gray-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
}

export function tourStatusIcon(status: string): string {
  const map: Record<string, string> = {
    interested: "👀",
    upcoming: "📅",
    visited: "✅",
    offer_made: "💰",
    under_contract: "📝",
    passed: "⏭️",
    rejected: "❌",
    withdrawn: "↩️",
  };
  return map[status] || "❓";
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
