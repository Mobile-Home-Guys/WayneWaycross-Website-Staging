import { CallToAction, Footer } from "../components/Closing";
import HomeCard from "../components/HomeCard";
import JsonLd, { breadcrumbSchema } from "../components/JsonLd";
import Nav from "../components/Nav";
import PageHeader from "../components/PageHeader";
import { clearance, specs } from "../lib/homes";
import { pageMetadata } from "../lib/seo";
import { site, usd } from "../lib/site";

export const metadata = pageMetadata({
  title: `Mobile Home Specials & Clearance Homes | ${site.fullName}`,
  description: `Clearance mobile homes at special pricing at ${site.fullName} in ${site.city}. Call ${site.phone} for current specials.`,
  path: "/specials",
});

export default function SpecialsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Specials", path: "/specials" }])} />
      <Nav />
      <main id="main">
        <PageHeader
          eyebrow="Available for a limited time"
          title="Quality homes at special pricing"
          image="/homes/tundra/0.jpg"
          lead={
            <>
          Enjoy special pricing without compromising on craftsmanship. Call {site.phone} for current specials.
            </>
          }
        />

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-[1280px]">
            <h2 className="display text-[clamp(2.2rem,4vw,3rem)]">Clearance homes</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clearance.map((h) => (
                <div key={h.slug}>
                  <HomeCard home={h} heading="h3" sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
                  <p className="sr-only">
                    {specs(h)}, marked down {usd(h.markdown!)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
