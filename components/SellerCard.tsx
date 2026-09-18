import { Star, BadgeCheck, MapPin } from "lucide-react";
import type { petListingDetail } from "@/data/listings";

type Seller = (typeof petListingDetail)["seller"];

export default function SellerCard({ seller }: { seller: Seller }) {
  return (
    <aside className="rounded-card border border-line p-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-[#8C8A8E]" />
        <div>
          <p className="font-semibold text-ink">{seller.name}</p>
          {seller.verified && (
            <p className="flex items-center gap-1 text-xs font-medium text-brand">
              <BadgeCheck size={14} />
              Verified
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-sm text-ink-soft">
        <Star size={14} className="fill-accent-amber text-accent-amber" />
        <Star size={14} className="fill-accent-amber text-accent-amber" />
        <Star size={14} className="fill-accent-amber text-accent-amber" />
        <Star size={14} className="fill-accent-amber text-accent-amber" />
        <Star size={14} className="fill-accent-amber text-accent-amber" />
        <span className="ml-1 font-medium text-ink">{seller.rating.toFixed(1)}</span>
        <span>({seller.reviews})</span>
      </div>

      <p className="mt-2 text-sm text-ink-muted">
        On Marketli since {seller.memberSince}
      </p>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-brand">
        <MapPin size={14} />
        {seller.location}
      </p>

      <button
        type="button"
        className="mt-4 w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Send Message
      </button>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        To deter and identify potential fraud, spam or suspicious behaviour,
        we reserve the right to monitor conversations. By sending the message
        you agree to our{" "}
        <a href="#" className="underline hover:text-ink-soft">
          Terms of Use
        </a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-ink-soft">
          Privacy Policy
        </a>
        .
      </p>
    </aside>
  );
}
