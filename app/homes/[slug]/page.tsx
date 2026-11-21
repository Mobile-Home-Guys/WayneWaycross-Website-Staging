import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CallToAction, Footer } from "../../components/Closing";
import JsonLd, { breadcrumbSchema } from "../../components/JsonLd";
import HomeCard from "../../components/HomeCard";
import Gallery from "../../components/Gallery";
import { ArrowRight, Check, PhoneIcon } from "../../components/Icons";
import Nav from "../../components/Nav";
import { hasDesigner } from "../../lib/designer";
import { cover, getHome, homes, homeAlt } from "../../lib/homes";
import { pageMetadata } from "../../lib/seo";
import { site, usd } from "../../lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return homes.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const home = getHome((await params).slug);
  if (!home) return {};
  return pageMetadata({
    title: `The ${home.name}: ${home.beds} Bed, ${home.baths} Bath Mobile Home | ${site.fullName}`,
    description: `See the ${home.name}, a ${home.beds}-bedroom, ${home.baths}-bath, ${home.sqft.toLocaleString("en-US")} sq ft manufactured home at ${site.fullName} in ${site.city}. Call ${site.phone} for pricing and delivery.`,
    path: `/homes/${home.slug}`,
    image: { url: cover(home), alt: homeAlt(home) },
  });
}

export default async function HomePage({ params }: Props) {
  const home = getHome((await params).slug);
  if (!home) notFound();

  const similar = homes
    .filter((h) => h.slug !== home.slug && h.beds === home.beds)
    .sort((a, b) => Math.abs(a.sqft - home.sqft) - Math.abs(b.sqft - home.sqft))
    .slice(0, 3);

  const designable = hasDesigner(home.slug);
  const stats = [
    { label: "Beds", value: home.beds },
    { label: "Baths", value: home.baths },
    { label: "Sq ft", value: home.sqft.toLocaleString("en-US") },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Homes", path: "/homes" },
          { name: `The ${home.name}`, path: `/homes/${home.slug}` },
        ])}
      />
      <Nav />
      <main>
        <section id="top" className="night-surface relative overflow-hidden text-white">
          <div className="relative mx-auto max-w-[1328px] px-4 pt-32 pb-12 sm:px-6 md:pt-40">
            <nav aria-label="Breadcrumb" className="text-sm text-white/60">
              <Link href="/homes" className="hover:text-white">
                Homes
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white">The {home.name}</span>
            </nav>
            <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow text-[#ff6b70]">
                  {[home.section, ...home.series].filter(Boolean).join(" · ") || "On our lot"}
                </p>
                <h1 className="display mt-4 text-[clamp(3rem,7vw,5.6rem)]">The {home.name}</h1>
                <div className="mt-5 flex flex-wrap gap-2">
                  {home.onLot && (
                    <span className="rounded-md bg-white px-3 py-1 text-xs font-bold tracking-[0.12em] text-clay uppercase">
                      Available on our lot
                    </span>
                  )}
                  {home.markdown && (
                    <span className="rounded-md bg-clay px-3 py-1 text-xs font-bold tracking-[0.12em] text-white uppercase">
                      Marked down {usd(home.markdown)}
                    </span>
                  )}
                  {designable && (
                    <span className="rounded-md border border-gold/50 px-3 py-1 text-xs font-bold tracking-[0.12em] text-gold uppercase">
                      Design online
                    </span>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
                {stats.map((s) => (
                  <div key={s.label} className="bg-night/90 px-5 py-4 sm:px-7">
                    <dt className="text-[11px] font-bold tracking-[0.14em] text-white/55 uppercase">{s.label}</dt>
                    <dd className="display mt-1 text-3xl sm:text-4xl">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="h-1 bg-clay" />
        </section>

        <section className="px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <Gallery images={home.images} alt={homeAlt(home)} />
            <aside className="space-y-4 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-line bg-white p-7 shadow-[0_30px_60px_-40px_rgba(13,21,32,0.45)]">
                <h2 className="display text-[28px]">See the {home.name} in person</h2>
                <p className="mt-3 leading-relaxed text-muted">
                  Come see the {home.name}{" "}in person. We&rsquo;ll walk you through floor plan options, customization,
                  delivery and setup.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <a
                    href={site.phoneHref}
                    className="group inline-flex items-center justify-center gap-2 rounded-lg bg-clay px-7 py-4 font-bold text-white transition-colors hover:bg-clay-dark"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    Call {site.phone}
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-lg border border-ink/15 bg-white px-7 py-4 font-bold text-ink transition-colors hover:border-clay hover:text-clay"
                  >
                    Request a visit
                  </Link>
                </div>
                <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm text-muted">
                  {["Exclusive Live Oak Homes retailer", "Built in the Waycross area", "Local delivery & setup"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-clay" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              {designable && (
                <Link
                  href={`/homes/${home.slug}/design`}
                  className="group night-surface flex items-center gap-4 overflow-hidden rounded-2xl p-6 text-white ring-1 ring-night transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex-1">
                    <span className="block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">Design online</span>
                    <span className="display mt-1 block text-2xl">Design this home</span>
                    <span className="mt-1 block text-sm text-white/65">
                      Pick the siding, cabinets, counters and floors on real photos of the {home.name}.
                    </span>
                  </span>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-clay">
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )}
            </aside>
          </div>
        </section>

        {home.tour && (
          <section className="px-4 pb-20 sm:px-6">
            <div className="mx-auto max-w-[1280px]">
              <p className="eyebrow">Virtual tour</p>
              <h2 className="display mt-4 text-[clamp(2.2rem,4vw,3rem)]">Take a 3D tour</h2>
              <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl border border-line bg-band">
                <iframe
                  src={`https://my.matterport.com/show/?m=${home.tour}`}
                  title={`${home.name} 3D tour`}
                  loading="lazy"
                  allowFullScreen
                  allow="fullscreen; xr-spatial-tracking"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section className="bg-band px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-[1280px]">
              <p className="eyebrow">Keep looking</p>
              <h2 className="display mt-4 text-[clamp(2.2rem,4vw,3rem)]">Similar homes</h2>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((h) => (
                  <HomeCard key={h.slug} home={h} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
                ))}
              </div>
            </div>
          </section>
        )}

        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
