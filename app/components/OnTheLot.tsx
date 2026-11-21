import Link from "next/link";
import { hasDesigner } from "../lib/designer/series";
import { getHome, homes, type Home } from "../lib/homes";
import { lot, LOT_UPDATED } from "../lib/lot";
import { site } from "../lib/site";
import HomeCard from "./HomeCard";
import { ArrowRight, PhoneIcon } from "./Icons";
import QuoteForm from "./QuoteForm";

const sizes = [
  { section: "Single wide", param: "single" },
  { section: "Double wide", param: "double" },
  { section: "Triple wide", param: "triple" },
] as const;

/**
 * "On our lot now": eight lot homes as cards (the ones customers can design first), the size
 * buckets, and the lot models that have no page yet. On a phone the quote form follows.
 */
export default function OnTheLot() {
  const lotHomes = lot.map((l) => (l.slug ? getHome(l.slug) : undefined)).filter((h): h is Home => !!h);
  const featured = [...lotHomes]
    .sort((a, b) => Number(hasDesigner(b.slug)) - Number(hasDesigner(a.slug)))
    .slice(0, 8);
  const noPage = lot.filter((l) => !l.slug || !getHome(l.slug)).map((l) => l.name);

  return (
    <>
      <section id="listings" className="scroll-mt-32 bg-band">
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Walk through today</p>
              <h2 className="mt-2 text-4xl md:text-6xl">On our lot now</h2>
              <p className="mt-3 max-w-2xl text-lg text-muted">
                {lot.length} homes ready to tour at {site.address.street}, as of {LOT_UPDATED}. Tap one for photos and
                specs, or design it in your own colors.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/homes?show=lot" className="btn btn-outline group px-5 py-2.5">
                All {lot.length} on our lot
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/homes" className="btn btn-ink group px-5 py-2.5">
                See all {homes.length}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
            {featured.map((h) => (
              <li key={h.slug} className="w-[84%] shrink-0 snap-start sm:w-auto">
                <HomeCard home={h} sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 84vw" />
              </li>
            ))}
          </ul>

          {noPage.length > 0 && (
            <p className="mt-6 text-[15px] text-muted">
              Also on the lot: {noPage.join(", ")}.{" "}
              <a href={site.phoneHref} className="font-semibold text-clay underline-offset-4 hover:underline">
                Call us
              </a>{" "}
              to see them.
            </p>
          )}

          <h3 className="mt-12 text-2xl text-ink">Shop by size</h3>
          <div className="mt-4 grid grid-cols-3 gap-3 md:gap-4">
            {sizes.map(({ section, param }) => {
              const all = homes.filter((h) => h.section === section).length;
              const onLot = lot.filter((l) => l.section === section).length;
              return (
                <Link
                  key={section}
                  href={`/homes?type=${param}`}
                  className="flex flex-col items-center border-2 border-line bg-white px-2 py-5 text-center transition-colors hover:border-clay"
                >
                  <span className="text-lg font-bold tracking-[0.04em] uppercase [font-family:var(--font-condensed)] md:text-2xl">
                    {section}s
                  </span>
                  <span className="mt-1 text-[13px] text-muted">
                    {all} floor plans<span className="hidden sm:inline"> · {onLot} on our lot</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* On a phone the hero has no form, so it comes here, right after the homes */}
      <section id="quote" className="bg-white md:hidden">
        <div className="px-4 py-12">
          <h2 className="text-4xl">Get a free quote</h2>
          <p className="mt-2 mb-6 text-lg text-muted">Tell us a little and our team will call you back. No obligation.</p>
          <QuoteForm tone="light" />
          <a href={site.phoneHref} className="mt-5 flex items-center justify-center gap-2 font-semibold text-ink">
            <PhoneIcon className="h-5 w-5 text-clay" />
            Or call {site.phone}
          </a>
        </div>
      </section>
    </>
  );
}
