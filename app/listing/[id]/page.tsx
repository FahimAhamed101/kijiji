import Link from "next/link";
import { Heart, Share2, Home, CalendarDays, PawPrint, Eye, Flag } from "lucide-react";
import ListingGallery from "@/components/ListingGallery";
import SellerCard from "@/components/SellerCard";
import Description from "@/components/Description";
import ListingRail from "@/components/ListingRail";
import { petListingDetail, similarPetListings } from "@/data/listings";

export default function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const listing = petListingDetail; // single seeded listing for this demo

  return (
    <div className="pb-10">
      <div className="shell flex flex-wrap items-center gap-1.5 py-4 text-sm text-ink-muted">
        {listing.breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1.5">
            {i > 0 && <span>/</span>}
            <Link href="#" className="hover:text-brand">
              {crumb}
            </Link>
          </span>
        ))}
        <span>/</span>
        <span>Ad ID {listing.id}</span>
      </div>

      <div className="shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <ListingGallery />

          <h1 className="mt-6 text-2xl font-bold text-ink">{listing.title}</h1>
          <p className="mt-1 text-2xl font-bold text-ink">{listing.price}</p>
          <p className="mt-1 text-sm text-ink-muted">Posted {listing.postedAgo}</p>

          <div className="mt-4 flex gap-3 border-b border-line pb-5">
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              <Heart size={16} />
              Save
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 border-b border-line py-6 sm:grid-cols-3">
            <DetailFact
              icon={<Home size={18} />}
              label="Earliest Rehoming Date"
              value={listing.earliestRehomingDate}
            />
            <DetailFact
              icon={<CalendarDays size={18} />}
              label="Pet's Date of Birth"
              value={listing.dob}
            />
            <DetailFact
              icon={<PawPrint size={18} />}
              label="Breed"
              value={listing.breed}
            />
          </div>

          <div className="mt-6 rounded-card bg-surface p-5">
            <p className="mb-2 font-semibold text-ink">Before making any decisions</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
              <li>Meet the breeder or seller in person</li>
              <li>Inspect the pet and its living conditions</li>
              <li>Have a plan to spay or neuter, and microchip your pet</li>
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Our Pets section is not intended to facilitate uncontrolled
              breeding, irresponsible commercial pet trading, or the trade of
              animals for fighting or stud services. Listings suspected of
              promoting this kind of activity will be removed. See our{" "}
              <a href="#" className="underline hover:text-ink-soft">
                FAQ page
              </a>{" "}
              to learn more about pet adoption.
            </p>
          </div>

          <Description paragraphs={listing.description} />

          <section className="border-t border-line py-6">
            <h2 className="mb-4 text-lg font-bold text-ink">Listed By</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-11 w-11 shrink-0 rounded-full bg-[#8C8A8E]" />
              <div className="mr-auto">
                <p className="font-semibold text-ink">{listing.seller.name}</p>
                <p className="text-xs font-medium text-brand">Verified · Owner</p>
              </div>
              <Link href="#" className="text-sm font-medium text-brand hover:underline">
                View all listings (2)
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-card border border-line text-center">
              <Stat value={listing.seller.avgReply} label="avg reply" />
              <Stat value={listing.seller.replyRate} label="reply rate" />
              <Stat value={listing.seller.yearsOnSite} label="on Marketli" />
            </div>
          </section>

          <div className="flex items-center gap-4 border-t border-line pt-5 text-sm text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Eye size={16} />
              {listing.seller.views.toLocaleString()} views
            </span>
            <button type="button" className="flex items-center gap-1.5 hover:text-ink-soft">
              <Flag size={14} />
              Report Listing
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <SellerCard seller={listing.seller} />
        </div>
      </div>

      <ListingRail title="Similar Listings" listings={similarPetListings} />

      <p className="shell py-4 text-center text-sm text-ink-muted">
        Take steps to make your transactions as secure as possible.{" "}
        <a href="#" className="text-brand hover:underline">
          Read our safety tips
        </a>
        .
      </p>
    </div>
  );
}

function DetailFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-ink-soft">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-sm text-ink-soft">{value}</p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 py-3">
      <p className="font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
