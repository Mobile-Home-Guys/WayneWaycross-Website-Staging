import Image from "next/image";
import type { ReactNode } from "react";

/** Dark title band that opens every inner page, with an optional photo fading in on the right. */
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
    <section id="top" className="night-surface relative overflow-hidden text-white">
      {image && (
        <div className="absolute inset-y-0 right-0 hidden w-[55%] md:block">
          <Image src={image} alt="" fill preload sizes="55vw" className="object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-night via-night/60 to-night/10" />
        </div>
      )}
      <div className="relative mx-auto max-w-[1328px] px-4 pt-36 pb-16 sm:px-6 md:pt-44 md:pb-20">
        <p className="eyebrow hero-in text-[#ff6b70]">{eyebrow}</p>
        <h1 className="display hero-in mt-5 max-w-3xl text-[clamp(2.7rem,6vw,5rem)] [animation-delay:80ms]">{title}</h1>
        {lead && (
          <p className="hero-in mt-5 max-w-xl text-lg leading-relaxed text-white/75 [animation-delay:160ms]">{lead}</p>
        )}
        {children && <div className="hero-in mt-8 [animation-delay:240ms]">{children}</div>}
      </div>
      <div className="h-1 bg-clay" />
    </section>
  );
}
