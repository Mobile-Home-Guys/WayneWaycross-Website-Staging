import Image from "next/image";
import Link from "next/link";
import { site } from "../lib/site";
import { ArrowRight, Check, HouseIcon, KeyIcon, PhoneIcon, ShieldIcon, TreeIcon } from "./Icons";

const features = [
  {
    icon: TreeIcon,
    title: "Built right here",
    body: "Our Live Oak homes are built in the Waycross area, so you save thousands in freight and get local service and support.",
  },
  {
    icon: HouseIcon,
    title: "Homes for every family",
    body: "Singlewide, doublewide and triplewide floor plans, from cozy two-bedrooms to five-bedroom family homes.",
  },
  {
    icon: ShieldIcon,
    title: "Quality you can rely on",
    body: "Built in a controlled factory to meet and exceed the federal HUD code, inspected by a third party, with Energy Star options.",
  },
  {
    icon: KeyIcon,
    title: "Delivered and set up",
    body: "Our team handles delivery and setup, and we ship to Florida, Georgia and South Carolina.",
  },
];

const steps = [
  ["Walk the lot", "Come see the homes in person at our Waycross lot, or browse them all here first."],
  ["Pick your home", "Choose the floor plan that fits, and design its colors online if you like."],
  ["We build the plan", "Our team answers every question, explains your options and works to your budget."],
  ["Delivered and set", "We deliver and set up your home, across Florida, Georgia and South Carolina."],
] as const;

/** Tour band, why-us reasons, a full-bleed photo statement and the lot-to-keys steps. */
export default function Features() {
  return (
    <>
      {/* Book a visit */}
      <section id="tour" className="bg-white">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <p className="eyebrow">Not ready to call? That&rsquo;s fine.</p>
            <h2 className="mt-2 text-4xl md:text-6xl">Come walk them this week</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
              The homes on our lot are open to tour at {site.address.street}. Take your time, open every cabinet, and ask
              our team anything.
            </p>
            <ul className="mt-6 grid gap-2.5 text-[16px] text-ink-soft">
              {[
                "Walk through real Live Oak homes, not just pictures",
                "Bring the whole family",
                "Ask anything: floor plans, finishes, delivery and setup",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t-4 border-clay bg-band p-6 md:p-8">
            <h3 className="text-3xl">Set up your visit</h3>
            <dl className="mt-5 grid gap-4 text-[16px]">
              <div>
                <dt className="spec text-[13px] tracking-[0.12em] text-muted uppercase">Where</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {site.address.street}, {site.address.city}, {site.address.region} {site.address.postalCode}
                </dd>
              </div>
              <div>
                <dt className="spec text-[13px] tracking-[0.12em] text-muted uppercase">When</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {site.hoursText
                    .filter(([, t]) => t !== "Closed")
                    .map(([d, t]) => `${d} ${t}`)
                    .join(" · ")}
                </dd>
              </div>
            </dl>
            <div className="mt-6 grid gap-3 sm:flex">
              <a href={site.phoneHref} className="btn btn-red px-6 py-3.5">
                <PhoneIcon className="h-5 w-5" />
                {site.phone}
              </a>
              <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline px-6 py-3.5">
                Get directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="why" className="scroll-mt-32 border-t border-line bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="eyebrow">Why Wayne Frier of Waycross</p>
            <h2 className="mt-2 text-4xl md:text-6xl">The homes are built here. That&rsquo;s your advantage.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Built in Waycross and sold in Waycross. Having the manufacturing facilities nearby means real savings on
              freight and a team that can answer every question.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article key={f.title} className="border-t-4 border-clay bg-band p-6">
                <f.icon className="h-8 w-8 text-clay" />
                <h3 className="mt-4 text-2xl">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Photo statement */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src="/hero.jpg" alt="Living room of a Live Oak model home" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.7)_100%)]" />
        </div>
        <div className="flex min-h-[460px] flex-col items-center justify-end px-4 pt-12 pb-14 text-center text-white">
          <h2 className="max-w-4xl text-4xl [text-shadow:0_2px_10px_rgba(0,0,0,0.4)] md:text-6xl">
            The flagship store in Live Oak&rsquo;s hometown
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-white/90">
            One team for the home, the finishes, the delivery and the setup, right here in Waycross.
          </p>
          <Link href="/about" className="btn btn-ghost-white group mt-6 px-6 py-3">
            Our story
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Lot to keys */}
      <section id="process" className="bg-band">
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 text-4xl md:text-6xl">Lot to keys in four steps</h2>
          </div>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, body], i) => (
              <li key={title} className="bg-white p-6 text-center shadow-[0_2px_0_var(--color-ink)]">
                <span className="mx-auto flex h-14 w-14 items-center justify-center bg-clay text-2xl font-bold text-white [font-family:var(--font-condensed)]">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-2xl">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
