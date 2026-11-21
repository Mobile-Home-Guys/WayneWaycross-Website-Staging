import { CallToAction, Footer } from "../components/Closing";
import JsonLd, { breadcrumbSchema } from "../components/JsonLd";
import HomesBrowser from "../components/HomesBrowser";
import Nav from "../components/Nav";
import PageHeader from "../components/PageHeader";
import { homes } from "../lib/homes";
import { pageMetadata } from "../lib/seo";
import { site } from "../lib/site";

export const metadata = pageMetadata({
  title: `Mobile Home Floor Plans for Sale | ${site.fullName}`,
  description: `Browse ${homes.length} singlewide, doublewide and triplewide Live Oak Homes floor plans, from 2 to 5 bedrooms, at Wayne Frier Home Center of Waycross in Waycross, GA.`,
  path: "/homes",
});

export default function HomesPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Homes", path: "/homes" }])} />
      <Nav />
      <main id="main">
        <PageHeader
          eyebrow="Our homes"
          title="Find your floor plan"
          image="/homes/highlander/0.jpg"
          lead={
            <>
          {homes.length} floor plans across eight home series, from cozy two-bedrooms to five-bedroom family homes. Come
          see them at our lot in {site.city}.
            </>
          }
        />

        <section className="px-4 pt-10 pb-8 sm:px-6">
          <div className="mx-auto max-w-[1280px]">
            <HomesBrowser />
          </div>
        </section>

        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
