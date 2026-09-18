import Link from "next/link";
import ListingRail from "@/components/ListingRail";
import CategoryTiles from "@/components/CategoryTiles";
import {
  galleryListings,
  nearbyListings,
  buySellListings,
  realEstateListings,
} from "@/data/listings";

const popularNearYou = [
  "Free Stuff",
  "Swap / Trade",
  "Wanted Ads",
  "1 Bedroom Apartment",
  "Apartment",
  "Apartment For Rent",
  "House For Rent",
  "iPhone",
  "Massage",
  "Private Room For Rent",
];

const autoTiles = [
  { label: "Cars & Trucks", color: "#2A1450" },
  { label: "Classic Cars", color: "#3B1E6D" },
  { label: "RVs, Campers & Trailers", color: "#5A3399" },
  { label: "Boats & Watercraft", color: "#78468F" },
];

const realEstateTiles = [
  { label: "Apartments & Condos for Rent", color: "#3B1E6D" },
  { label: "Houses for Rent", color: "#5A3399" },
  { label: "Houses for Sale", color: "#2A1450" },
];

const buySellTiles = [
  { label: "Furniture", color: "#3B1E6D" },
  { label: "Home, Outdoor & Garden", color: "#5A3399" },
  { label: "Tools", color: "#2A1450" },
];

export default function HomePage() {
  return (
    <div className="pb-10">
      <div className="shell pt-6">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">
          Canada&rsquo;s most trusted and loved marketplace
        </h1>
      </div>

      <ListingRail title="Homepage Gallery" listings={galleryListings} />
      <ListingRail title="Recently Added Near You" listings={nearbyListings} />

      <section className="shell py-6">
        <h2 className="mb-4 text-lg font-bold text-ink">Popular Near You</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-soft">
          {popularNearYou.map((tag) => (
            <Link key={tag} href="#" className="hover:text-brand hover:underline">
              {tag}
            </Link>
          ))}
        </div>
      </section>

      <CategoryTiles title="Autos in Canada" tiles={autoTiles} seeAllLabel="Browse All Autos" />

      <CategoryTiles
        title="Real Estate in Canada"
        tiles={realEstateTiles}
        seeAllLabel="Browse All Real Estate"
      />
      <ListingRail title="Popular Listings in Real Estate" listings={realEstateListings} />

      <MembershipBanner />

      <CategoryTiles
        title="Buy and Sell in Canada"
        tiles={buySellTiles}
        seeAllLabel="Browse All Buy and Sell"
      />
      <ListingRail title="Popular Listings in Buy and Sell" listings={buySellListings} />
    </div>
  );
}

function MembershipBanner() {
  return (
    <section className="shell py-6">
      <div className="flex flex-col items-center gap-4 rounded-card bg-brand px-6 py-8 text-center text-white">
        <div>
          <p className="text-lg font-bold">Marketli&rsquo;s better when you&rsquo;re a member</p>
          <p className="mt-1 text-sm text-white/80">
            See more relevant listings, find what you&rsquo;re looking for
            quicker, and more.
          </p>
        </div>
        <Link
          href="/signin"
          className="rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-brand transition hover:bg-white/90"
        >
          Sign In
        </Link>
      </div>
    </section>
  );
}
