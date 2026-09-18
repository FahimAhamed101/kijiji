import Link from "next/link";
import { Search, ChevronDown, MapPin } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="shell flex items-center gap-3 py-3">
        <Link href="/" className="shrink-0 text-2xl font-extrabold tracking-tight text-brand">
          market<span className="text-ink">li</span>
        </Link>

        <div className="hidden flex-1 items-stretch overflow-hidden rounded-full border border-line md:flex">
          <input
            type="text"
            placeholder="What are you looking for?"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
          <button
            type="button"
            className="flex items-center gap-1.5 border-l border-line px-3 text-sm text-ink-soft"
          >
            All categories
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Search size={16} />
            Search
          </button>
        </div>

        <button
          type="button"
          className="hidden items-center gap-1 whitespace-nowrap text-sm text-ink-soft lg:flex"
        >
          <MapPin size={16} />
          Canada
        </button>

        <nav className="ml-auto hidden items-center gap-4 whitespace-nowrap text-sm text-ink-soft lg:flex">
          <button type="button" className="hover:text-ink">
            EN
          </button>
          <Link href="/register" className="hover:text-ink">
            Register
          </Link>
          <span className="text-line">or</span>
          <Link href="/signin" className="hover:text-ink">
            Sign In
          </Link>
        </nav>

        <Link
          href="/post"
          className="ml-2 whitespace-nowrap rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Post
        </Link>
      </div>

      <div className="hidden border-t border-line bg-canvas md:block">
        <nav className="shell flex items-center gap-6 overflow-x-auto py-2.5 text-sm text-ink-soft no-scrollbar">
          {[
            "Buy & Sell",
            "Cars & Vehicles",
            "Real Estate",
            "Jobs",
            "Services",
            "Pets",
            "Community",
            "Vacation Rentals",
          ].map((item) => (
            <Link
              key={item}
              href="#"
              className="whitespace-nowrap font-medium hover:text-brand"
            >
              {item}
            </Link>
          ))}
          <span className="ml-auto whitespace-nowrap rounded bg-accent-amber/90 px-2 py-0.5 text-xs font-semibold text-ink">
            Trending: Tires & Rims
          </span>
        </nav>
      </div>
    </header>
  );
}
