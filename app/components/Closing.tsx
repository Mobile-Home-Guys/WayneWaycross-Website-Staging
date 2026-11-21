import Image from "next/image";
import Link from "next/link";
import { site } from "../lib/site";
import Reveal from "./Reveal";
import { ArrowRight, Check, Logo, PhoneIcon, PinIcon } from "./Icons";
import QuoteForm from "./QuoteForm";

export function CallToAction() {
  const trust = ["Exclusive Live Oak Homes retailer", "Energy Star certified homes", "Local delivery & setup"];
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden bg-night px-4 py-24 md:py-32">
      <Image src="/hero.jpg" alt="" fill sizes="100vw" className="object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-night via-night/90 to-night/70" />
      <div className="absolute inset-x-0 top-0 h-1 bg-clay" />

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-white">
          <Reveal as="p" className="eyebrow text-[#ff6b70]">
            Get started
          </Reveal>
          <Reveal as="h2" delay={80} className="display mt-5 text-[clamp(2.6rem,5.4vw,4.4rem)]">
            Ready to find your way home?
          </Reveal>
          <Reveal as="p" delay={120} className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
            Tell us a little about what you&rsquo;re looking for and we&rsquo;ll put together a free quote. Or visit our
            lot in {site.city}. We&rsquo;d love to meet your family.
          </Reveal>
          <Reveal delay={240} className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/homes"
              className="group inline-flex items-center gap-2.5 rounded-lg bg-clay px-7 py-4 text-[16px] font-bold text-white transition-colors hover:bg-clay-dark"
            >
              Browse homes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-2.5 rounded-lg border border-white/30 bg-white/5 px-7 py-4 text-[16px] font-bold text-white backdrop-blur transition-colors hover:border-white/60 hover:bg-white/10"
            >
              <PhoneIcon className="h-5 w-5" />
              Call {site.phone}
            </a>
          </Reveal>
          <Reveal as="ul" delay={360} className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-white/85">
            {trust.map((t) => (
              <li key={t} className="inline-flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-night">
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </Reveal>
        </div>

        <Reveal
          delay={200}
          className="rounded-2xl border border-white/15 bg-night-2/80 p-6 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-md sm:p-10"
        >
          <p className="text-[11px] font-bold tracking-[0.18em] text-gold uppercase">Talk to our team</p>
          <h3 className="display mt-2 text-[clamp(1.8rem,3vw,2.4rem)] text-white">Get a free quote</h3>
          <div className="mt-7">
            <QuoteForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const shop = [
    { href: "/homes", label: "All homes" },
    { href: "/#on-the-lot", label: "On our lot" },
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
  const { street, city, region, postalCode } = site.address;
  const heading = "text-[11px] font-bold tracking-[0.18em] text-white/45 uppercase";
  return (
    <footer className="bg-night text-white/70">
      <div className="mx-auto grid max-w-[1328px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <span className="inline-block rounded-xl bg-white px-3 py-2">
            <Logo className="h-12" />
          </span>
          <p className="mt-6 max-w-xs leading-relaxed">
            The exclusive Live Oak Homes retailer in {city}, {region}. Built in Waycross, sold in Waycross.
          </p>
          <ul className="mt-6 flex gap-2">
            {social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg border border-white/15 px-3 py-1.5 text-sm transition-colors hover:border-white/40 hover:text-white"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <nav aria-label="Shop">
          <p className={heading}>Shop</p>
          <ul className="mt-5 space-y-3">
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
          <ul className="mt-5 space-y-3">
            {company.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <address className="not-italic">
          <p className={heading}>Visit us</p>
          <a
            href={site.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex gap-2.5 transition-colors hover:text-white"
          >
            <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-clay" />
            <span>
              {street}
              <br />
              {city}, {region} {postalCode}
            </span>
          </a>
          <a href={site.phoneHref} className="mt-4 flex items-center gap-2.5 font-bold text-white hover:text-clay">
            <PhoneIcon className="h-5 w-5 shrink-0 text-clay" />
            {site.phone}
          </a>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-sm">
            {site.hoursText.map(([d, t]) => (
              <div key={d} className="contents">
                <dt className="font-semibold text-white/85">{d}</dt>
                <dd>{t}</dd>
              </div>
            ))}
          </dl>
        </address>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1328px] flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-white/45 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.fullName}
          </p>
          <p>Exclusive Live Oak Homes retailer</p>
        </div>
      </div>
    </footer>
  );
}
