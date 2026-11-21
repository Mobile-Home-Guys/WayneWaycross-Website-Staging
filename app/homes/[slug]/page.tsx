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
      <main id="main">
        <section id="top" className="relative overflow-hidden bg-ink text-white">
          <div className="relative mx-auto max-w-[1280px] px-4 pt-8 pb-12 sm:px-6 md:pt-10 lg:px-8">
            <nav aria-label="Breadcrumb" className="spec text-[14px] tracking-[0.08em] text-white/60 uppercase">
              <Link href="/homes" className="hover:text-white">
                Homes
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white">The {home.name}</span>
            </nav>
            <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow text-[#ff4d55]">
                  {[home.section, ...home.series].filter(Boolean).join(" · ") || "On our lot"}
                </p>
                <h1 className="mt-3 text-[3rem] sm:text-7xl lg:text-[5.5rem]">The {home.name}</h1>
                <div className="mt-5 flex flex-wrap gap-2">
                  {home.onLot && (
                    <span className="tag bg-white text-ink">
                      Available on our lot
                    </span>
                  )}
                  {home.markdown && (
                    <span className="tag bg-clay text-white">
                      Marked down {usd(home.markdown)}
                    </span>
                  )}
                  {designable && (
                    <span className="tag border border-white/40 text-white">
                      Design online
                    </span>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-px overflow-hidden border-t-4 border-clay bg-white/10">
                {stats.map((s) => (
                  <div key={s.label} className="bg-night-2 px-5 py-4 sm:px-7">
                    <dt className="spec text-[13px] tracking-[0.12em] text-white/60 uppercase">{s.label}</dt>
                    <dd className="mt-1 text-3xl font-bold [font-family:var(--font-condensed)] sm:text-4xl">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="h-1.5 bg-clay" />
        </section>

        <section className="px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <Gallery images={home.images} alt={homeAlt(home)} />
            <aside className="space-y-4 lg:sticky lg:top-28">
              <div className="border-t-4 border-clay bg-band p-7">
                <h2 className="text-3xl">See the {home.name} in person</h2>
                <p className="mt-3 leading-relaxed text-muted">
                  Come see the {home.name}{" "}in person. We&rsquo;ll walk you through floor plan options, customization,
                  delivery and setup.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <a
                    href={site.phoneHref}
                    className="btn btn-red px-7 py-4"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    Call {site.phone}
                  </a>
                  <Link
                    href="/contact"
                    className="btn btn-outline bg-white px-7 py-4"
                  >
                    Request a visit
                  </Link>
                </div>
                <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm text-muted">
                  {["Exclusive Live Oak Homes retailer", "Built in the Waycross area", "Local delivery & setup"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-sage" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              {designable && (
                <Link
                  href={`/homes/${home.slug}/design`}
                  className="group flex items-center gap-4 overflow-hidden border-t-4 border-clay bg-ink p-6 text-white transition-colors hover:bg-night-3"
                >
                  <span className="flex-1">
                    <span className="eyebrow text-[#ff4d55]">Design online</span>
                    <span className="mt-1 block text-3xl font-bold uppercase [font-family:var(--font-condensed)]">Design this home</span>
                    <span className="mt-1 block text-sm text-white/65">
                      Pick the siding, cabinets, counters and floors on real photos of the {home.name}.
                    </span>
                  </span>
                  <span className="grid h-12 w-12 shrink-0 place-items-center bg-clay">
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
