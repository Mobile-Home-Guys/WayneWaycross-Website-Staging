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
      <main className="px-4 pt-32 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <Link href={`/homes/${home.slug}`} className="text-sm font-medium text-clay hover:text-clay-dark">
            ← Back to the {home.name}
          </Link>
          <h1 className="display mt-4 text-[clamp(2.8rem,5.5vw,4.4rem)]">Design your {home.name}</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Pick your colors on real photos of this home, one at a time. When you&rsquo;re done, send us your design
            and we&rsquo;ll call you to talk it through.
          </p>
          <div className="mt-10">
            <HomeDesigner
              slug={home.slug}
              name={home.name}
              series={DESIGNER_SERIES[slug]}
              photos={photos}
              groups={groups}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
