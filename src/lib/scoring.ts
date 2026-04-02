export interface PriorityLike {
  id: string;
  name: string;
  category: string;
  rank: number;
}

export interface EvaluationLike {
  priorityId: string;
  met: string;
}

export interface ScoreResult {
  score: number;
  earned: number;
  possible: number;
  mustHavesMet: number;
  mustHavesTotal: number;
  hasDealbreaker: boolean;
  breakdown: {
    priority: PriorityLike;
    met: string;
    points: number;
    maxPoints: number;
  }[];
}

export function calculateScore(
  priorities: PriorityLike[],
  evaluations: EvaluationLike[]
): ScoreResult {
  if (priorities.length === 0) {
    return {
      score: 0,
      earned: 0,
      possible: 0,
      mustHavesMet: 0,
      mustHavesTotal: 0,
      hasDealbreaker: false,
      breakdown: [],
    };
  }

  const n = priorities.length;
  const evalMap = new Map(evaluations.map((e) => [e.priorityId, e]));
  let earned = 0;
  let possible = 0;
  let mustHavesMet = 0;
  let mustHavesTotal = 0;
  let hasDealbreaker = false;

  const breakdown = priorities.map((p) => {
    const basePoints = n - p.rank + 1;
    const multiplier = p.category === "must_have" ? 2 : 1;
    const maxPoints = basePoints * multiplier;
    possible += maxPoints;

    if (p.category === "must_have") mustHavesTotal++;

    const evaluation = evalMap.get(p.id);
    let points = 0;

    if (evaluation) {
      if (evaluation.met === "yes") {
        points = maxPoints;
        if (p.category === "must_have") mustHavesMet++;
      } else if (evaluation.met === "partial") {
        points = Math.round(maxPoints * 0.5);
        if (p.category === "must_have") hasDealbreaker = true;
      } else if (evaluation.met === "no") {
        if (p.category === "must_have") hasDealbreaker = true;
      }
    }

    earned += points;
    return { priority: p, met: evaluation?.met ?? "not_evaluated", points, maxPoints };
  });

  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;

  return {
    score,
    earned,
    possible,
    mustHavesMet,
    mustHavesTotal,
    hasDealbreaker,
    breakdown,
  };
}

export function getCombinedScore(scores: ScoreResult[]): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / scores.length);
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

export function getScoreBgColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}
