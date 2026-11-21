import Image from "next/image";
import type { ReactNode } from "react";

/** Title band that opens every inner page: a darkened photo behind a condensed headline. */
export default function PageHeader({
  eyebrow,
  title,
  lead,
  image,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  image?: string;
  children?: ReactNode;
}) {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 -z-10">
        <Image src={image ?? "/hero.jpg"} alt="" fill preload sizes="100vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,23,26,0.95)_0%,rgba(20,23,26,0.75)_55%,rgba(20,23,26,0.45)_100%)]" />
      </div>
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <p className="eyebrow text-[#ff4d55]">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-[2.6rem] sm:text-6xl lg:text-7xl">{title}</h1>
        {lead && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">{lead}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
      <div className="h-1.5 bg-clay" />
    </section>
  );
}
