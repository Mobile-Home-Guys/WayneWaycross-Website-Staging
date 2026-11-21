import Image from "next/image";
import Link from "next/link";
import { DESIGNER_SERIES, designerSlugs } from "../lib/designer";
import { cover, getHome, type Home } from "../lib/homes";
import { ArrowRight, RollerIcon } from "./Icons";

const seriesOrder = ["Extreme", "XT", "Oak"] as const;

const steps = [
  ["Pick a home", "Choose one of the Live Oak homes below."],
  ["Choose your finishes", "Siding, cabinets, counters, floors and walls, on real photos."],
  ["Send it to us", "We call you to talk it through."],
] as const;

/** Every home with an online designer, on a charcoal band; each card opens that home's designer. */
export default function DesignShowcase() {
  const designable = designerSlugs()
    .map((slug) => getHome(slug))
    .filter((h): h is Home => !!h)
    .sort(
      (a, b) =>
        seriesOrder.indexOf(DESIGNER_SERIES[a.slug]) - seriesOrder.indexOf(DESIGNER_SERIES[b.slug]) ||
        a.name.localeCompare(b.name),
    );
  if (designable.length === 0) return null;

  return (
    <section id="design" className="scroll-mt-32 bg-ink text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-[#ff4d55]">
              <RollerIcon className="h-5 w-5" />
              Design online
            </p>
            <h2 className="mt-2 text-4xl md:text-6xl">Design your home before you visit</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
              {`${designable.length} of our homes can be designed online.`}{" "}Pick your colors on real photos of the home,
              from Live Oak Homes&rsquo; own color choices, then send us your design.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {steps.map(([title, body], i) => (
              <li key={title} className="flex gap-4 border-l-4 border-clay bg-white/[0.05] p-4">
                <span className="text-3xl leading-none font-bold text-clay [font-family:var(--font-condensed)]">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-lg font-bold tracking-[0.04em] uppercase [font-family:var(--font-condensed)]">
                    {title}
                  </span>
                  <span className="block text-sm text-white/65">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <ul className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-6">
          {designable.map((h) => (
            <li key={h.slug} className="w-[70%] shrink-0 snap-start sm:w-auto">
              <Link
                href={`/homes/${h.slug}/design`}
                className="group flex h-full flex-col overflow-hidden border-t-4 border-clay bg-night-2 transition-colors hover:bg-night-3"
              >
                <span className="relative block aspect-[4/3] overflow-hidden">
                  <Image
                    src={cover(h)}
                    alt={`The ${h.name}`}
                    fill
                    sizes="(min-width: 1280px) 200px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 70vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="tag absolute top-2 left-2 bg-white text-ink">{DESIGNER_SERIES[h.slug]} Series</span>
                </span>
                <span className="flex flex-1 flex-col p-3.5">
                  <span className="text-2xl leading-none font-bold uppercase [font-family:var(--font-condensed)]">
                    {h.name}
                  </span>
                  <span className="spec mt-1 block text-[13px] text-white/60">
                    {h.beds} bd · {h.baths} ba · {h.sqft.toLocaleString("en-US")} sq ft
                  </span>
                  <span className="spec mt-3 flex items-center gap-1.5 text-[14px] tracking-[0.06em] text-[#ff4d55] uppercase">
                    Design it
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
