"use client";

import { useState } from "react";

type Props = {
  value: number;
  onChange: (v: number) => void;
};

export function StarInput({ value, onChange }: Props) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="cursor-pointer p-1 -m-1 transition-transform hover:scale-110"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill={n <= display ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="text-[#F5B400]"
          >
            <path d="M12 2.5l2.92 6.36 6.92.69-5.22 4.78 1.48 6.92L12 17.77 5.9 21.25l1.48-6.92L2.16 9.55l6.92-.69L12 2.5z" />
          </svg>
        </button>
      ))}
      <span className="ml-3 text-xs text-muted tabular-nums w-20">
        {display ? `${display} de 5` : "Toque pra avaliar"}
      </span>
    </div>
  );
}
