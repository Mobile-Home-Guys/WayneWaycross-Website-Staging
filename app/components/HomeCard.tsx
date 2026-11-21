import Image from "next/image";
import Link from "next/link";
import { designableRooms } from "../lib/designer/designable.generated";
import { hasDesigner } from "../lib/designer/series";
import { cover, homeAlt, specs, type Home } from "../lib/homes";
import { usd } from "../lib/site";
import { ArrowRight, BathIcon, BedIcon, PinIcon, RollerIcon, RulerIcon } from "./Icons";

/** The red "Design your X" button that opens a home's online designer; renders nothing without one. */
export function DesignButton({ home, className = "" }: { home: Home; className?: string }) {
  if (!hasDesigner(home.slug)) return null;
  const rooms = designableRooms[home.slug];
  return (
    <Link
      href={`/homes/${home.slug}/design`}
      className={`btn btn-red relative z-20 w-full justify-center gap-3 px-5 py-3 ${className}`}
    >
      <RollerIcon className="h-6 w-6 shrink-0" />
      <span className="flex flex-col items-start text-left leading-tight">
        <span>Design your {home.name}</span>
        <span className="mt-0.5 text-[13px] font-medium tracking-normal normal-case opacity-85 [font-family:var(--font-barlow)]">
          {rooms > 1 ? `Pick colors in ${rooms} rooms` : "Pick your colors"}
        </span>
      </span>
    </Link>
  );
}

/**
 * Listing card: red bar on top, photo with solid tags, the specs, the designer button when the
 * home has one, and where it can be seen. The whole card opens the home's page.
 * `heading` keeps the outline valid: h3 under a section's h2, h2 when the grid sits straight under the page's h1.
 */
export default function HomeCard({
  home,
  sizes,
  heading: Heading = "h3",
  className = "",
}: {
  home: Home;
  sizes: string;
  heading?: "h2" | "h3";
  className?: string;
}) {
  const designable = hasDesigner(home.slug);
  return (
    <article className={`home-card group relative flex h-full flex-col overflow-hidden ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-band">
        <Image
          src={cover(home)}
          alt={homeAlt(home)}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
          {home.onLot && <span className="tag bg-ink text-white">On our lot</span>}
          {home.markdown && <span className="tag bg-clay text-white">{usd(home.markdown)} off</span>}
          {designable && <span className="tag bg-white text-ink">Design online</span>}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <p className="spec pointer-events-none absolute bottom-3 left-4 text-[13px] tracking-[0.14em] text-white uppercase">
          {home.section ?? "Manufactured home"}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Heading className="text-[1.75rem] leading-none text-ink">{home.name}</Heading>
        {home.series.length > 0 && (
          <p className="spec mt-1.5 text-[13px] tracking-[0.1em] text-muted uppercase">
            Live Oak Homes · {home.series.join(" · ")}
          </p>
        )}

        <ul className="spec mt-4 mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-ink-soft">
          <li className="flex items-center gap-1.5">
            <BedIcon className="h-4 w-4 text-muted" />
            {home.beds} bd
          </li>
          <li className="flex items-center gap-1.5">
            <BathIcon className="h-4 w-4 text-muted" />
            {home.baths} ba
          </li>
          <li className="flex items-center gap-1.5">
            <RulerIcon className="h-4 w-4 text-muted" />
            {home.sqft.toLocaleString("en-US")} sq ft
          </li>
        </ul>

        <DesignButton home={home} className="mt-auto mb-4" />

        <div
          className={`flex items-center justify-between gap-4 border-t border-line pt-4 text-[14px] ${designable ? "" : "mt-auto"}`}
        >
          <span className="flex items-center gap-1.5 text-muted">
            <PinIcon className="h-3.5 w-3.5" />
            {home.onLot ? "On display in Waycross" : "Available to order"}
          </span>
          <span className="flex items-center gap-1 font-semibold text-ink transition-colors group-hover:text-clay">
            View
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>

      <Link href={`/homes/${home.slug}`} className="absolute inset-0 z-10" aria-label={`The ${home.name}: ${specs(home)}`}>
        <span className="sr-only">View the {home.name}</span>
      </Link>
    </article>
  );
}
