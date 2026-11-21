import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "../../../components/Closing";
import HomeDesigner from "../../../components/HomeDesigner";
import JsonLd, { breadcrumbSchema } from "../../../components/JsonLd";
import Nav from "../../../components/Nav";
import { DESIGNER_SERIES, designerFor, designerSlugs, groupsFor } from "../../../lib/designer";
import { cover, getHome } from "../../../lib/homes";
import { pageMetadata } from "../../../lib/seo";
import { site } from "../../../lib/site";

type Props = { params: Promise<{ slug: string }> };

/* Only homes with a designer have this page; every other slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return designerSlugs()
    .filter((slug) => getHome(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const home = getHome(slug);
  if (!home || !designerFor(slug)) return {};
  return pageMetadata({
    title: `Design Your ${home.name} | ${site.fullName}`,
    description: `Pick the siding, cabinets, countertops, floors and wall colors for the ${home.name} on real photos of the home, from Live Oak Homes' own color choices. Then send your design to ${site.fullName}.`,
    path: `/homes/${home.slug}/design`,
    image: { url: cover(home), alt: `The ${home.name}` },
  });
}

export default async function DesignPage({ params }: Props) {
  const { slug } = await params;
  const home = getHome(slug);
  const photos = designerFor(slug);
  if (!home || !photos) notFound();
  const groups = groupsFor(slug, photos);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Homes", path: "/homes" },
          { name: `The ${home.name}`, path: `/homes/${home.slug}` },
          { name: "Design", path: `/homes/${home.slug}/design` },
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
              <Link href={`/homes/${home.slug}`} className="hover:text-white">
                The {home.name}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white">Design</span>
            </nav>
            <p className="eyebrow mt-6 text-[#ff4d55]">Live Oak {DESIGNER_SERIES[slug]} Series · Design online</p>
            <h1 className="mt-3 text-[2.8rem] sm:text-6xl lg:text-7xl">Design your {home.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
              Pick your colors on real photos of this home, one at a time. When you&rsquo;re done, send us your design
              and we&rsquo;ll call you to talk it through.
            </p>
          </div>
          <div className="h-1.5 bg-clay" />
        </section>
        <section className="px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-[1280px]">
            <HomeDesigner
              slug={home.slug}
              name={home.name}
              series={DESIGNER_SERIES[slug]}
              photos={photos}
              groups={groups}
            />
            <p className="mt-10 text-center text-sm text-muted">
              Questions while you design? Call us at{" "}
              <a href={site.phoneHref} className="font-bold text-clay hover:text-clay-dark">
                {site.phone}
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
