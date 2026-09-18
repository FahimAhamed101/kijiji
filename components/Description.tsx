"use client";

import { useState } from "react";

export default function Description({ paragraphs }: { paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? paragraphs : paragraphs.slice(0, 2);

  return (
    <section className="border-t border-line py-6">
      <h2 className="mb-3 text-lg font-bold text-ink">Description</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
        {visible.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {paragraphs.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
        >
          {expanded ? "Show Less" : "Show More"}
        </button>
      )}
    </section>
  );
}
