"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showDealbreaker?: boolean;
}

export default function ScoreRing({
  score,
  size = 64,
  strokeWidth = 5,
  label,
  showDealbreaker = false,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75
      ? "#5a9e8f"
      : score >= 50
      ? "#f59e0b"
      : score > 0
      ? "#ef4444"
      : "#d4c8b6";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e8e0d4"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {showDealbreaker ? (
            <span className="text-red-500 text-sm font-bold">!</span>
          ) : (
            <span
              className="font-bold"
              style={{ fontSize: size * 0.28, color }}
            >
              {score}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs text-sand-400 font-medium">{label}</span>
      )}
    </div>
  );
}
