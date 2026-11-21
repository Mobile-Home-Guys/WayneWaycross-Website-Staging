import Image from "next/image";
import Link from "next/link";
import { designerSlugs } from "../lib/designer";
import { getHome, homes } from "../lib/homes";
import { lot } from "../lib/lot";
import { site } from "../lib/site";
import { ArrowRight, PhoneIcon } from "./Icons";

const featured = getHome("heritage");
const second = getHome("georgia-giant");

/** Dark flagship hero: the "built here, sold here" story on the left, real Live Oak photos on the right. */
export default function Hero() {
  const designable = designerSlugs().filter((s) => getHome(s)).length;
  const stats = [
    { value: String(lot.length), label: "Homes on our lot" },
    { value: String(homes.length), label: "Floor plans" },
    { value: String(designable), label: "Homes to design online" },
    { value: "1997", label: "Serving Waycross since" },
  ];

  return (
    <section id="top" className="night-surface relative overflow-hidden text-white">
      <div className="mx-auto grid max-w-[1328px] items-center gap-12 px-4 pt-32 pb-16 sm:px-6 md:pt-40 lg:grid-cols-[1.12fr_1fr] lg:gap-14 lg:pb-24">
        <div>
          <p className="eyebrow hero-in text-[#ff6b70]">Waycross, Georgia</p>
          <h1 className="display hero-in mt-6 text-[clamp(2.7rem,5.2vw,4.4rem)] [animation-delay:80ms]">
            Built in Waycross.
            <span className="block text-clay">Sold in Waycross.</span>
          </h1>
          <p className="hero-in mt-6 max-w-xl text-lg leading-relaxed text-white/75 [animation-delay:160ms]">
            {site.fullName} is the exclusive Live Oak Homes retailer in Waycross, with one of the largest inventories
            of manufactured homes in the Southeast. Homes built right here save you thousands in freight, and our team
            delivers and sets them up.
          </p>
          <div className="hero-in mt-9 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <Link
              href="/homes"
              className="group inline-flex items-center justify-center gap-2.5 rounded-lg bg-clay px-8 py-4 text-[16px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(192,31,38,0.8)] transition-colors hover:bg-clay-dark"
            >
              Browse our homes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/#design"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-white/30 bg-white/5 px-8 py-4 text-[16px] font-bold text-white backdrop-blur transition-colors hover:border-white/60 hover:bg-white/10"
            >
              Design your home online
            </Link>
          </div>
          <a
            href={site.phoneHref}
            className="hero-in mt-5 inline-flex items-center gap-2 text-[15px] text-white/70 transition-colors [animation-delay:300ms] hover:text-white"
          >
            <PhoneIcon className="h-4 w-4 text-clay" />
            Or call us at <span className="font-semibold text-white">{site.phone}</span>
          </a>

          <dl className="hero-in mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 [animation-delay:380ms] sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-night/90 px-4 py-4">
                <dt className="sr-only">{s.label}</dt>
                <dd className="display text-3xl text-white">{s.value}</dd>
                <dd className="mt-1 text-xs font-medium tracking-wide text-white/60 uppercase">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hero-in relative [animation-delay:200ms]">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Image
                src={featured?.images[0] ?? "/hero.jpg"}
                alt={
                  featured
                    ? `The ${featured.name}, a Live Oak home on our lot in ${site.city}`
                    : `A Live Oak home at ${site.fullName}`
                }
                fill
                preload
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" />
              {featured?.onLot && (
                <Link
                  href={`/homes/${featured.slug}`}
                  className="group absolute bottom-4 left-4 flex items-center gap-3 rounded-xl bg-white/95 py-2.5 pr-3 pl-4 text-ink shadow-xl backdrop-blur transition-transform hover:-translate-y-0.5"
                >
                  <span>
                    <span className="block text-[11px] font-bold tracking-[0.14em] text-clay uppercase">
                      On our lot now
                    </span>
                    <span className="block text-sm font-semibold">
                      The {featured.name} · {featured.beds} bed · {featured.baths} bath
                    </span>
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-clay text-white">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )}
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Image
                src="/hero.jpg"
                alt="Living room of a Live Oak model home"
                fill
                sizes="(min-width: 1024px) 300px, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Image
                src={second?.images[0] ?? "/hero.jpg"}
                alt={second ? `The ${second.name}, a ${second.beds}-bedroom Live Oak home` : "A Live Oak home"}
                fill
                sizes="(min-width: 1024px) 300px, 50vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute -top-5 -right-2 hidden rotate-3 rounded-xl border border-gold/40 bg-night-2 px-4 py-3 shadow-2xl sm:block">
            <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Exclusive retailer</p>
            <p className="display mt-0.5 text-lg">Live Oak Homes</p>
          </div>
        </div>
      </div>

      {/* Red trust band */}
      <div className="border-t border-white/10 bg-clay">
        <ul className="mx-auto flex max-w-[1328px] flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 py-4 text-[13px] font-bold tracking-[0.1em] text-white uppercase sm:px-6 lg:justify-between">
          {[
            "Exclusive Live Oak Homes retailer",
            "Energy Star certified homes",
            "Third-party inspected",
            "Delivery to FL, GA & SC",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-white" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
