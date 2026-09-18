import Link from "next/link";
import type { Listing } from "@/data/listings";
import ListingCard from "./ListingCard";

export default function ListingRail({
  title,
  listings,
  seeAllHref = "#",
}: {
  title: string;
  listings: Listing[];
  seeAllHref?: string;
}) {
  return (
    <section className="shell py-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <Link
          href={seeAllHref}
          className="text-sm font-medium text-brand hover:underline"
        >
          See All
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
