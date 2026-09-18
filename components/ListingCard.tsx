"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Listing } from "@/data/listings";

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block w-[168px] shrink-0 sm:w-[190px]"
    >
      <div
        className="relative mb-2 aspect-[4/3] w-full overflow-hidden rounded-card"
        style={{ backgroundColor: listing.color }}
      >
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          aria-label="Save listing"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-soft shadow-card transition group-hover:text-brand"
        >
          <Heart size={14} />
        </button>
      </div>
      <p className="line-clamp-2 text-sm font-medium text-ink">
        {listing.title}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">{listing.location}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{listing.price}</p>
    </Link>
  );
}
