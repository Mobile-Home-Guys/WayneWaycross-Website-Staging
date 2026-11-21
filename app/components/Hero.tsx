import Image from "next/image";
import { designerSlugs } from "../lib/designer";
import { getHome, homes } from "../lib/homes";
import { lot } from "../lib/lot";
import { site } from "../lib/site";
import { ArrowRight, Check, PhoneIcon, PinIcon } from "./Icons";
import QuoteForm from "./QuoteForm";

const backdrop = getHome("heritage");

/**
 * Full-bleed lot photo with the headline and calls on the left and the quote form beside it,
 * then a ticker of the store's facts. On a phone the form waits further down the page.
 */
export default function Hero() {
  const designable = designerSlugs().filter((s) => getHome(s)).length;
  const ticker = [
    "Exclusive Live Oak Homes retailer",
    "Built in Waycross",
    `${homes.length} floor plans`,
    `${lot.length} homes on our lot`,
    `${designable} homes to design online`,
    "Energy Star certified homes",
    "Third-party inspected",
    "Delivery to FL, GA & SC",
    "Serving Waycross since 1997",
  ];

  return (
    <>
      <section id="top" className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={backdrop?.images[0] ?? "/hero.jpg"}
            alt={`The ${backdrop?.name ?? "Heritage"}, a Live Oak home on our lot in ${site.city}`}
            fill
            preload
            quality={85}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,14,0.55)_0%,rgba(10,12,14,0.82)_100%)]" />
        </div>

        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:px-8 lg:py-24">
          <div className="text-white">
            <p className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur-sm">
              <PinIcon className="h-4 w-4 shrink-0 text-gold" />
              {lot.length} homes to walk on our Waycross lot
            </p>
            <h1 className="mt-5 text-[2.9rem] sm:text-6xl lg:text-[5.25rem]">
              Built in Waycross.
              <span className="block text-[#ff4d55]">Sold in Waycross.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
              The exclusive Live Oak Homes retailer in Waycross. {homes.length} floor plans, {designable} you can design
              online, and our own team for delivery and setup.
            </p>
            <div className="mt-8 grid gap-3 sm:flex">
              <a href="#listings" className="btn btn-red group px-8 py-4 text-lg">
                See the homes
                <ArrowRight className="h-5 w-5 rotate-90 transition-transform group-hover:translate-y-0.5" />
              </a>
              <a
                href={site.phoneHref}
                aria-label={`Call ${site.name} at ${site.phone}`}
                className="btn btn-ghost-white px-8 py-4 text-lg"
              >
                <PhoneIcon className="h-5 w-5 shrink-0" />
                {site.phone}
              </a>
            </div>
            <ul className="mt-7 grid gap-2 text-[15px] text-white/90 sm:flex sm:flex-wrap sm:gap-x-6">
              {["Serving Waycross since 1997", "Energy Star certified homes", "Delivery to FL, GA & SC"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#6fcf97]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden border-t-4 border-clay bg-[#111417]/90 p-6 shadow-2xl backdrop-blur md:block lg:p-8">
            <p className="text-xl font-bold tracking-[0.06em] text-white uppercase [font-family:var(--font-condensed)]">
              Get a free quote
            </p>
            <p className="mt-1 mb-5 text-sm text-white/65">
              Tell us a little and our team will call you back. No obligation.
            </p>
            <QuoteForm />
          </div>
        </div>
      </section>

      {/* Ticker of the store's facts */}
      <div className="overflow-hidden border-y border-ink bg-ink py-3 text-white" aria-label="About our store">
        <ul className="animate-marquee flex w-max gap-10 pr-10 text-[15px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase [font-family:var(--font-condensed)]">
          {[...ticker, ...ticker].map((t, i) => (
            <li key={i} aria-hidden={i >= ticker.length} className="flex items-center gap-10">
              {t}
              <span className="h-1.5 w-1.5 rotate-45 bg-clay" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
