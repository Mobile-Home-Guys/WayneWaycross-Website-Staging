"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "../lib/site";
import { Logo, PhoneIcon, PinIcon } from "./Icons";

const links = [
  { href: "/homes", label: "Homes" },
  { href: "/#design", label: "Design Online" },
  { href: "/specials", label: "Specials" },
  { href: "/upgrades", label: "Upgrades" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const openHours = site.hoursText
  .filter(([, t]) => t !== "Closed")
  .map(([d, t]) => `${d} ${t}`)
  .join(" · ");

/**
 * Every page opens on a dark band, so the bar starts transparent with white links and
 * turns into a solid white bar once the page is scrolled.
 */
export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const light = solid || open;
  const { street, city, region } = site.address;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Utility bar: who we are and where to find us */}
      <div
        className={`hidden overflow-hidden bg-night text-[13px] text-white/75 transition-[max-height,opacity] duration-500 md:block ${
          solid ? "max-h-0 opacity-0" : "max-h-10 opacity-100"
        }`}
      >
        <div className="mx-auto flex h-9 max-w-[1328px] items-center justify-between px-6">
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" />
            Exclusive Live Oak Homes retailer in {city}, {region}
          </p>
          <p className="flex items-center gap-6">
            <a
              href={site.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <PinIcon className="h-3.5 w-3.5" />
              {street}, {city}
            </a>
            <span className="hidden lg:inline">{openHours}</span>
          </p>
        </div>
      </div>

      <div
        className={`border-b transition-colors duration-500 ${
          light
            ? "border-line bg-white/95 shadow-[0_10px_30px_-20px_rgba(13,21,32,0.45)] backdrop-blur-xl"
            : "border-white/10 bg-night/40 backdrop-blur-sm"
        }`}
      >
        <nav className="mx-auto flex h-[72px] max-w-[1328px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            aria-label={`${site.fullName} home`}
            className="rounded-xl bg-white px-2.5 py-1.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]"
          >
            <Logo className="h-9 sm:h-10" />
          </Link>
          <ul
            className={`hidden items-center gap-1 text-[13px] font-bold tracking-[0.08em] uppercase lg:flex ${
              light ? "text-ink" : "text-white"
            }`}
          >
            {links.map((l) => {
              const active = !l.href.includes("#") && !!pathname?.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block px-3.5 py-2 transition-colors after:absolute after:inset-x-3.5 after:bottom-0 after:h-0.5 after:origin-left after:bg-clay after:transition-transform after:duration-300 ${
                      active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
                    } ${light ? "hover:text-clay" : "hover:text-white/80"}`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2">
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-2 rounded-lg bg-clay px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(192,31,38,0.7)] transition-colors hover:bg-clay-dark"
            >
              <PhoneIcon className="h-4 w-4" />
              <span className="sm:hidden">Call</span>
              <span className="hidden sm:inline">{site.phone}</span>
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className={`grid h-10 w-10 place-items-center rounded-lg border transition-colors lg:hidden ${
                light ? "border-line bg-white text-ink" : "border-white/25 bg-white/10 text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden="true"
              >
                {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </nav>
        {/* Links hidden in the bar below lg; always in the DOM so crawlers see them */}
        <ul
          id="mobile-menu"
          className={`flex-col border-t border-line bg-white px-4 pt-1 pb-5 text-[15px] font-bold text-ink lg:hidden ${
            open ? "flex" : "hidden"
          }`}
        >
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line py-3.5 tracking-wide uppercase"
              >
                {l.label}
                <span aria-hidden="true" className="text-clay">
                  →
                </span>
              </Link>
            </li>
          ))}
          <li className="pt-4 text-sm font-normal text-muted">
            {street}, {city}, {region}
            <br />
            {openHours}
          </li>
        </ul>
      </div>
    </header>
  );
}
