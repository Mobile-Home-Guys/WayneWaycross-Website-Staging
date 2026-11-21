import Image from "next/image";
import Link from "next/link";
import { hasDesigner } from "../lib/designer/series";
import { cover, homeAlt, type Home } from "../lib/homes";
import { usd } from "../lib/site";
import { ArrowRight } from "./Icons";

/**
 * Photo card for a single home model; `large` fills a taller grid slot.
 * `heading` keeps the outline valid: h3 under a section's h2, h2 when the grid sits straight under the page's h1.
 */
export default function HomeCard({
  home,
  large = false,
  sizes,
  heading: Heading = "h3",
}: {
  home: Home;
  large?: boolean;
  sizes: string;
  heading?: "h2" | "h3";
}) {
  const designable = hasDesigner(home.slug);
  return (
    <Link
      href={`/homes/${home.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-500 ease-out hover:-translate-y-1 hover:border-clay/30 hover:shadow-[0_30px_60px_-30px_rgba(13,21,32,0.4)]"
    >
      <div className={`relative overflow-hidden bg-band aspect-[4/3] ${large ? "lg:aspect-auto lg:flex-1" : ""}`}>
        <Image
          src={cover(home)}
          alt={homeAlt(home)}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night/45 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {home.markdown && (
            <span className="rounded-md bg-clay px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow">
              Marked down {usd(home.markdown)}
            </span>
          )}
          {home.onLot && (
            <span className="rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-ink uppercase shadow">
              On our lot
            </span>
          )}
          {designable && (
            <span className="rounded-md bg-night/85 px-2.5 py-1 text-[11px] font-bold tracking-wide text-gold uppercase shadow">
              Design online
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 items-end justify-between gap-3 p-5">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-clay uppercase">
            {home.section ?? home.series[0] ?? "Manufactured home"}
          </p>
          <Heading className={`display mt-1 ${large ? "text-[32px]" : "text-[24px]"}`}>{home.name}</Heading>
          <dl className="mt-3 flex gap-4 text-sm text-muted">
            <div>
              <dt className="sr-only">Bedrooms</dt>
              <dd>
                <span className="font-bold text-ink">{home.beds}</span> bed
              </dd>
            </div>
            <div>
              <dt className="sr-only">Bathrooms</dt>
              <dd>
                <span className="font-bold text-ink">{home.baths}</span> bath
              </dd>
            </div>
            <div>
              <dt className="sr-only">Square feet</dt>
              <dd>
                <span className="font-bold text-ink">{home.sqft.toLocaleString("en-US")}</span> sq ft
              </dd>
            </div>
          </dl>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-night text-white transition-colors group-hover:bg-clay">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
