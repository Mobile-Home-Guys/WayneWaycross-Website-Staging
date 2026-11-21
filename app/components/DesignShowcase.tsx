import Image from "next/image";
import Link from "next/link";
import { DESIGNER_SERIES, designerSlugs } from "../lib/designer";
import { cover, getHome, type Home } from "../lib/homes";
import { ArrowRight } from "./Icons";
import Reveal from "./Reveal";

const seriesOrder = ["Extreme", "XT", "Oak"] as const;

const steps = [
  ["Pick a home", "Choose one of the Live Oak homes below."],
  ["Choose your finishes", "Siding, cabinets, counters, floors and walls, on real photos."],
  ["Send it to us", "We call you to talk it through."],
] as const;

/** Every home with an online designer, on a dark band; each card opens that home's designer. */
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
    <section id="design" className="night-surface scroll-mt-20 overflow-hidden py-24 text-white md:py-32">
      <div className="mx-auto max-w-[1328px] px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <Reveal as="p" className="eyebrow text-[#ff6b70]">
              Design online
            </Reveal>
            <Reveal as="h2" delay={80} className="display mt-5 text-[clamp(2.4rem,4.8vw,4rem)]">
              Design your Live Oak home before you visit.
            </Reveal>
            <Reveal as="p" delay={160} className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              {`${designable.length} of our homes can be designed online.`}{" "}Pick your colors on real photos of the home,
              from Live Oak Homes&rsquo; own color choices, then send us your design.
            </Reveal>
          </div>
          <Reveal as="ol" delay={200} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {steps.map(([title, body], i) => (
              <li key={title} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <span className="display grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-clay text-base">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className="block text-sm text-white/60">{body}</span>
                </span>
              </li>
            ))}
          </Reveal>
        </div>

        <ul className="-mx-4 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-6">
          {designable.map((h) => (
            <li key={h.slug} className="w-[72%] shrink-0 snap-start sm:w-auto">
              <Link
                href={`/homes/${h.slug}/design`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-night-2 transition-all duration-500 hover:-translate-y-1 hover:border-clay/70 hover:shadow-[0_30px_60px_-30px_rgba(192,31,38,0.6)]"
              >
                <span className="relative block aspect-[4/3] overflow-hidden">
                  <Image
                    src={cover(h)}
                    alt={`The ${h.name}`}
                    fill
                    sizes="(min-width: 1280px) 200px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 72vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-2 left-2 rounded-md bg-night/85 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-gold uppercase">
                    {DESIGNER_SERIES[h.slug]} Series
                  </span>
                </span>
                <span className="flex flex-1 items-center justify-between gap-2 p-3.5">
                  <span>
                    <span className="display block text-lg">{h.name}</span>
                    <span className="block text-xs text-white/55">
                      {h.beds} bed · {h.baths} bath
                      <br />
                      {h.sqft.toLocaleString("en-US")} sq ft
                    </span>
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 transition-colors group-hover:bg-clay">
                    <ArrowRight className="h-4 w-4" />
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
