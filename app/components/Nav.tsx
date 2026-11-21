"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "../lib/site";
import {
  Cross,
  HouseIcon,
  KeyIcon,
  Logo,
  MenuIcon,
  PhoneIcon,
  PinIcon,
  RollerIcon,
  ShieldIcon,
  StarIcon,
} from "./Icons";

const links = [
  { href: "/homes", label: "Homes", Icon: HouseIcon },
  { href: "/#design", label: "Design online", Icon: RollerIcon },
  { href: "/specials", label: "Specials", Icon: StarIcon },
  { href: "/upgrades", label: "Upgrades", Icon: KeyIcon },
  { href: "/about", label: "About", Icon: ShieldIcon },
  { href: "/contact", label: "Contact", Icon: PinIcon },
];

/** The red phone strip above the header: the number and what it's for, nothing else. */
function CallBar() {
  return (
    <div className="bg-clay py-2 text-center text-sm font-medium text-white">
      <a
        href={site.phoneHref}
        className="inline-flex items-center justify-center gap-2 px-4 transition-opacity hover:opacity-90"
      >
        <PhoneIcon className="h-4 w-4 shrink-0" />
        <span>Call now: {site.phone}</span>
        <span className="hidden sm:inline">· Exclusive Live Oak Homes retailer in Waycross</span>
      </a>
    </div>
  );
}

/**
 * Phone strip, then a white bar that sticks to the top as the page scrolls under it.
 * In flow rather than fixed, so no page has to leave room for it.
 */
export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const { street, city, region } = site.address;

  return (
    <>
      <a
        href="#main"
        className="sr-only bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50">
        <CallBar />
        <div className="border-b border-line bg-white">
          <div className="mx-auto flex min-h-[var(--header-h)] max-w-[1280px] items-center gap-4 px-4 py-2 sm:px-6 lg:px-8">
            <Link href="/" aria-label={`${site.fullName} home`} className="shrink-0 transition-opacity hover:opacity-80">
              <Logo className="h-11 sm:h-12" />
            </Link>

            <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 lg:flex">
              {links.map(({ href, label, Icon }) => {
                const active = href !== "/#design" && (pathname === href || pathname.startsWith(`${href}/`));
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 px-3 py-2 text-[15px] font-semibold whitespace-nowrap transition-colors xl:px-4 ${
                      active ? "bg-blush text-clay" : "text-ink hover:bg-band"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2 lg:ml-2">
              <a
                href={site.phoneHref}
                aria-label={`Call ${site.name} at ${site.phone}`}
                className="btn btn-outline hidden px-4 py-2.5 text-[15px] sm:inline-flex"
              >
                <PhoneIcon className="h-4 w-4 shrink-0" />
                {site.phone}
              </a>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                className="inline-flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-band lg:hidden"
              >
                {open ? <Cross className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-white transition-[opacity,visibility] duration-300 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="flex h-full flex-col overflow-y-auto px-5 pt-36 pb-10">
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-line py-4 text-lg font-semibold text-ink"
            >
              <Icon className="h-5 w-5 shrink-0 text-clay" />
              {label}
            </Link>
          ))}
          <a
            href={site.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={open ? 0 : -1}
            className="mt-6 flex items-start gap-3 text-muted"
          >
            <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-clay" />
            {street}, {city}, {region}
          </a>
          <a href={site.phoneHref} tabIndex={open ? 0 : -1} className="btn btn-red mt-8 w-full px-6 py-4 text-lg">
            <PhoneIcon className="h-5 w-5" />
            Call {site.phone}
          </a>
        </nav>
      </div>

      {/* Floating call button on phones */}
      <a
        href={site.phoneHref}
        aria-label={`Call ${site.phone}`}
        className="fixed right-4 bottom-4 z-30 flex h-14 w-14 items-center justify-center bg-clay text-white shadow-[0_10px_25px_-5px_rgba(192,31,38,0.5)] transition-colors hover:bg-ink md:hidden"
      >
        <PhoneIcon className="h-6 w-6" />
      </a>
    </>
  );
}
