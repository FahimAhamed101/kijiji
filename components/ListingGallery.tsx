"use client";

import { useState } from "react";

const SWATCHES = ["#7FA8C9", "#5F8CB0", "#4A6E8C", "#88ADCB", "#3C5A73"];

export default function ListingGallery() {
  const [active, setActive] = useState(0);

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-[1fr_auto]">
      <div
        className="col-span-4 aspect-[4/3] w-full rounded-card sm:col-span-1 sm:w-[420px]"
        style={{ backgroundColor: SWATCHES[active] }}
      />
      <div className="col-span-4 grid grid-cols-4 gap-2 sm:grid-cols-1 sm:content-start">
        {SWATCHES.slice(1).map((color, i) => {
          const index = i + 1;
          const isLast = index === SWATCHES.length - 1;
          return (
            <button
              key={color}
              type="button"
              onClick={() => setActive(index)}
              className="relative aspect-[4/3] w-full overflow-hidden rounded-md sm:w-[130px]"
              style={{ backgroundColor: color }}
            >
              {isLast && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-sm font-semibold text-white">
                  +6
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
