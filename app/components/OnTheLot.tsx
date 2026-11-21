import Image from "next/image";
import Link from "next/link";
import { cover, getHome, specs } from "../lib/homes";
import { lot, LOT_UPDATED, type LotHome } from "../lib/lot";
import { site } from "../lib/site";
import { ArrowRight, Logo, PhoneIcon } from "./Icons";
import Reveal from "./Reveal";

const groups = ["Triple wide", "Double wide", "Single wide"] as const;

function LotCard({ item }: { item: LotHome }) {
  const home = item.slug ? getHome(item.slug) : undefined;
  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-band">
        {home ? (
          <Image
            src={cover(home)}
            alt={`The ${home.name}, available on our lot`}
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <span className="night-surface absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-white/70">
            <span className="rounded-lg bg-white px-2 py-1">
              <Logo className="h-7" />
            </span>
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase">Photos coming soon</span>
          </span>
        )}
        <span className="absolute top-2.5 left-2.5 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] text-clay uppercase shadow">
          On our lot
        </span>
      </div>
      <div className="flex flex-1 items-center justify-between gap-2 p-4">
        <div>
          <h4 className="display text-[20px]">{item.name}</h4>
          <p className="mt-0.5 text-[13px] text-muted">
            {item.beds} bed · {item.baths} bath · {item.size} ft
          </p>
        </div>
        {home && (
          <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-band text-ink transition-colors group-hover:bg-clay group-hover:text-white sm:grid">
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </>
  );
  const cls = "group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white";
  return home ? (
    <Link
      href={`/homes/${home.slug}`}
      aria-label={`The ${home.name}: ${specs(home)}`}
      className={`${cls} transition-all duration-500 ease-out hover:-translate-y-1 hover:border-clay/30 hover:shadow-[0_24px_50px_-24px_rgba(13,21,32,0.4)]`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Home-page section listing every model currently on the lot, grouped by home type. */
export default function OnTheLot() {
  return (
    <section id="on-the-lot" className="scroll-mt-24 bg-band px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <Reveal as="p" className="eyebrow">
            Walk through today
          </Reveal>
          <Reveal as="h2" delay={80} className="display mt-5 text-[clamp(2.4rem,4.8vw,4rem)]">
            {lot.length} homes on our lot
          </Reveal>
          <Reveal as="p" delay={160} className="mt-5 max-w-xl text-lg text-muted">
            Ready to tour at {site.address.street}, as of {LOT_UPDATED}. We have more models than these, so ask us about
            anything you don&apos;t see.
          </Reveal>
        </div>
        <Reveal delay={200} className="flex flex-wrap gap-3">
          <Link
            href="/homes"
            className="group inline-flex items-center gap-2 rounded-lg bg-night px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-clay"
          >
            All floor plans
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href={site.phoneHref}
            className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-6 py-3.5 text-[15px] font-bold text-ink transition-colors hover:border-clay hover:text-clay"
          >
            <PhoneIcon className="h-4 w-4" />
            Book a tour
          </a>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 max-w-[1280px] space-y-14">
        {groups.map((section) => {
          const items = lot.filter((h) => h.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section}>
              <Reveal className="flex items-center gap-4 border-b border-ink/10 pb-4">
                <h3 className="display text-[clamp(1.6rem,2.6vw,2.1rem)]">{section}s</h3>
                <span className="rounded-md bg-night px-2.5 py-0.5 text-sm font-bold text-white">{items.length}</span>
              </Reveal>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {items.map((h, i) => (
                  <Reveal key={h.name} delay={(i % 4) * 70}>
                    <LotCard item={h} />
                  </Reveal>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
