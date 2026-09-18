import Link from "next/link";

type Tile = { label: string; color: string };

export default function CategoryTiles({
  title,
  tiles,
  seeAllHref = "#",
  seeAllLabel = "Browse All",
}: {
  title: string;
  tiles: Tile[];
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  return (
    <section className="shell py-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <Link
          href={seeAllHref}
          className="text-sm font-medium text-brand hover:underline"
        >
          {seeAllLabel}
        </Link>
      </div>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${tiles.length}, minmax(0,1fr))`,
        }}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href="#"
            className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-card sm:aspect-[16/10]"
            style={{ backgroundColor: tile.color }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
            <span className="relative m-3 rounded-md bg-brand/95 px-3 py-1.5 text-xs font-semibold text-white sm:text-sm">
              {tile.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
