"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

export function CategoryViewTracker({
  category,
  count,
}: {
  category: string;
  count: number;
}) {
  useEffect(() => {
    track("category_view", { meta: { category, count } });
  }, [category, count]);
  return null;
}
