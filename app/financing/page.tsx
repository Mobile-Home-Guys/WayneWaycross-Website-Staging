import { Footer } from "../components/Closing";
import HomeLeadForm from "../components/HomeLeadForm";
import { Check, PhoneIcon } from "../components/Icons";
import JsonLd, { breadcrumbSchema } from "../components/JsonLd";
import Nav from "../components/Nav";
import PageHeader from "../components/PageHeader";
import { pageMetadata } from "../lib/seo";
import { site } from "../lib/site";

export const metadata = pageMetadata({
  title: `Mobile Home Financing in Waycross, GA | ${site.fullName}`,
  description: `Request financing info from ${site.fullName} in ${site.city}. Answer a few quick questions and our team will call you with options. Not a credit application.`,
  path: "/financing",
});

const points = [
  "Not a credit application, and it won't affect your credit",
  "A few quick taps from your phone",
  "Our team calls you to talk through real options",
];

/** The financing request form on its own page, so the menu can link to it from anywhere. */
export default function FinancingPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Financing", path: "/financing" }])} />
      <Nav />
      <main id="main">
        <PageHeader
          eyebrow="Financing"
          title="Explore your financing options"
          image="/homes/heritage/0.jpg"
          lead="Not sure how to pay for your new home? Answer a few financing questions and a member of our team will reach out to talk through your options."
        />

        <section id="financing" className="scroll-mt-24 bg-band px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div>
              <h2 className="display text-[clamp(2.2rem,4vw,3rem)]">Request financing info</h2>
              <ul className="mt-6 grid gap-3 text-[17px] text-ink-soft">
                {points.map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 shrink-0 text-sage" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-muted">Rather talk now?</p>
              <a href={site.phoneHref} className="btn btn-outline mt-3 px-7 py-4">
                <PhoneIcon className="h-5 w-5" />
                Call {site.phone}
              </a>
            </div>
            <div className="bg-white p-6 sm:p-8">
              <HomeLeadForm kind="financing" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
