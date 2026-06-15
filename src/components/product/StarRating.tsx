type Props = {
  rating: number;
  size?: "xs" | "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
  className?: string;
};

const SIZE_MAP = {
  xs: { star: 10, gap: 1, text: "text-[10px]" },
  sm: { star: 14, gap: 2, text: "text-xs" },
  md: { star: 18, gap: 2, text: "text-sm" },
  lg: { star: 26, gap: 3, text: "text-base" },
};

export function StarRating({
  rating,
  size = "sm",
  showValue,
  count,
  className = "",
}: Props) {
  const { star, gap, text } = SIZE_MAP[size];
  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div
        className="relative inline-flex"
        style={{ gap: `${gap}px` }}
        aria-label={`${clamped.toFixed(1)} de 5 estrelas`}
      >
        {/* Empty layer */}
        <div className="flex" style={{ gap: `${gap}px` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={star} filled={false} />
          ))}
        </div>
        {/* Filled layer */}
        <div
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%`, gap: `${gap}px` }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={star} filled />
          ))}
        </div>
      </div>
      {(showValue || typeof count === "number") && (
        <span className={`ml-2 ${text} text-muted`}>
          {showValue && <span className="text-foreground font-medium">{clamped.toFixed(1)}</span>}
          {typeof count === "number" && (
            <span className="ml-1">({count})</span>
          )}
        </span>
      )}
    </div>
  );
}

function Star({ size, filled = false }: { size: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
      className="text-[#F5B400]"
      aria-hidden
    >
      <path d="M12 2.5l2.92 6.36 6.92.69-5.22 4.78 1.48 6.92L12 17.77 5.9 21.25l1.48-6.92L2.16 9.55l6.92-.69L12 2.5z" />
    </svg>
  );
}
