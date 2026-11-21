import Link from "next/link";
import { clearance, specs } from "../lib/homes";
import { usd } from "../lib/site";
import HomeCard from "./HomeCard";
import { ArrowRight } from "./Icons";

/** Clearance homes marked down on the dealership's Specials list. */
export default function Specials() {
  if (clearance.length === 0) return null;
  return (
    <section id="specials" className="scroll-mt-32 bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Specials</p>
            <h2 className="mt-2 text-4xl md:text-6xl">Marked down on our lot</h2>
            <p className="mt-3 max-w-xl text-lg text-muted">Available for a limited time. Call for current specials.</p>
          </div>
          <Link href="/specials" className="btn btn-ink group self-start px-5 py-2.5 md:self-auto">
            See all specials
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:max-w-[880px]">
          {clearance.map((h) => (
            <li key={h.slug}>
              <HomeCard home={h} sizes="(min-width: 640px) 430px, 100vw" />
              <p className="sr-only">
                {h.name}: {specs(h)}, marked down {usd(h.markdown!)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
