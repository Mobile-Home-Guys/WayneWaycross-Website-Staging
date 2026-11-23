import Link from "next/link";
import { site } from "../lib/site";
import { ArrowRight, Check, ClockIcon, Logo, PhoneIcon, PinIcon } from "./Icons";
import QuoteForm from "./QuoteForm";

/**
 * Contact band with the quote form, then the address, hours and phone in three columns.
 * The home page passes `form={false}`: its quote form already sits in the hero (or after the lot on a
 * phone), so the band offers a button back to it instead of a second copy.
 */
export function CallToAction({ form = true }: { form?: boolean } = {}) {
  const trust = ["Exclusive Live Oak Homes retailer", "Energy Star certified homes", "Local delivery & setup"];
  const { street, city, region, postalCode } = site.address;
  return (
    <>
      <section id="contact" className="scroll-mt-32 border-t-4 border-clay bg-white">
        <div
          className={`mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-6 md:py-20 lg:gap-16 lg:px-8 ${
            form ? "lg:grid-cols-[1fr_1.05fr]" : ""
          }`}
        >
          <div>
            <p className="eyebrow">Get started</p>
            <h2 className="mt-2 text-4xl md:text-6xl">Ready to find your way home?</h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">
              Tell us a little about what you&rsquo;re looking for and we&rsquo;ll put together a free quote. Or visit our
              lot in {site.city}. We&rsquo;d love to meet your family.
            </p>
            <ul className="mt-6 grid gap-2.5 text-[16px] text-ink-soft">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <Check className="h-5 w-5 shrink-0 text-sage" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-3 sm:flex">
              {!form && (
                <>
                  <a href="#quote" className="btn btn-red px-7 py-4 md:hidden">
                    Get a free quote
                  </a>
                  <a href="#top" className="btn btn-red hidden px-7 py-4 md:inline-flex">
                    Get a free quote
                  </a>
                </>
              )}
              <Link href="/homes" className="btn btn-ink group px-7 py-4">
                Browse homes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href={site.phoneHref} className="btn btn-outline px-7 py-4">
                <PhoneIcon className="h-5 w-5" />
                Call {site.phone}
              </a>
            </div>
          </div>

          {form && (
            <div className="bg-band p-6 sm:p-8">
              <h3 className="text-3xl">Get a free quote</h3>
              <p className="mt-1 mb-6 text-muted">Our team will call you back. No obligation.</p>
              <QuoteForm tone="light" />
            </div>
          )}
        </div>
      </section>

      <section aria-label="Visit us" className="bg-ink text-white">
        <div className="mx-auto grid max-w-[1280px] divide-y divide-white/10 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          <a
            href={site.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-4 py-8 transition-colors hover:text-[#ff4d55] md:pr-8"
          >
            <PinIcon className="h-8 w-8 shrink-0 text-clay" />
            <span>
              <span className="block text-xl font-bold tracking-[0.06em] uppercase [font-family:var(--font-condensed)]">
                Visit our lot
              </span>
              <span className="mt-1 block text-white/75">
                {street}, {city}, {region} {postalCode}
              </span>
              <span className="spec mt-2 block text-[14px] tracking-[0.08em] text-[#ff4d55] uppercase">Get directions</span>
            </span>
          </a>
          <div className="flex gap-4 py-8 md:px-8">
            <ClockIcon className="h-8 w-8 shrink-0 text-clay" />
            <div>
              <p className="text-xl font-bold tracking-[0.06em] uppercase [font-family:var(--font-condensed)]">Hours</p>
              <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 text-white/75">
                {site.hoursText.map(([d, t]) => (
                  <div key={d} className="contents">
                    <dt className="font-semibold text-white">{d}</dt>
                    <dd>{t}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <a href={site.phoneHref} className="group flex gap-4 py-8 transition-colors hover:text-[#ff4d55] md:pl-8">
            <PhoneIcon className="h-8 w-8 shrink-0 text-clay" />
            <span>
              <span className="block text-xl font-bold tracking-[0.06em] uppercase [font-family:var(--font-condensed)]">
                Call us
              </span>
              <span className="mt-1 block text-2xl font-bold [font-family:var(--font-condensed)]">{site.phone}</span>
              <span className="mt-1 block text-white/75">Talk to our team about any home.</span>
            </span>
          </a>
        </div>
      </section>
    </>
  );
}

export function Footer() {
  const shop = [
    { href: "/homes", label: "All homes" },
    { href: "/homes?show=lot", label: "On our lot" },
    { href: "/#design", label: "Design online" },
    { href: "/specials", label: "Specials" },
    { href: "/upgrades", label: "Upgrades" },
  ];
  const company = [
    { href: "/about", label: "About us" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/contact", label: "Contact" },
  ];
  const social = [
    { href: site.facebook, label: "Facebook" },
    { href: site.instagram, label: "Instagram" },
    { href: site.youtube, label: "YouTube" },
  ];
  const { city, region } = site.address;
  const heading = "text-lg font-bold tracking-[0.08em] text-white uppercase [font-family:var(--font-condensed)]";
  return (
    <footer className="border-t border-white/10 bg-night-2 text-white/70">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <span className="inline-block bg-white px-3 py-2">
            <Logo className="h-12" />
          </span>
          <p className="mt-5 max-w-xs leading-relaxed">
            The exclusive Live Oak Homes retailer in {city}, {region}. Built in Waycross, sold in Waycross.
          </p>
        </div>
        <nav aria-label="Shop">
          <p className={heading}>Shop</p>
          <ul className="mt-4 space-y-2.5">
            {shop.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className={heading}>Company</p>
          <ul className="mt-4 space-y-2.5">
            {company.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className={heading}>Follow us</p>
          <ul className="mt-4 space-y-2.5">
            {social.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-white/45 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {site.fullName}
          </p>
          <p>Exclusive Live Oak Homes retailer</p>
        </div>
      </div>
    </footer>
  );
}
