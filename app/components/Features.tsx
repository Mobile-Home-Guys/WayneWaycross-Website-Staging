import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowRight, HouseIcon, KeyIcon, ShieldIcon, TreeIcon } from "./Icons";

const features = [
  {
    icon: TreeIcon,
    title: "Built right here",
    body: "Our Live Oak homes are built in the Waycross area, so you save thousands in freight and get local service and support.",
  },
  {
    icon: HouseIcon,
    title: "Homes for every family",
    body: "Singlewide, doublewide and triplewide floor plans, from cozy two-bedrooms to five-bedroom family homes.",
  },
  {
    icon: ShieldIcon,
    title: "Quality you can rely on",
    body: "Built in a controlled factory to meet and exceed the federal HUD code, inspected by a third party, with Energy Star options.",
  },
  {
    icon: KeyIcon,
    title: "Delivered and set up",
    body: "Our team handles delivery and setup, and we ship to Florida, Georgia and South Carolina.",
  },
];

/** Why buy from the Waycross store: the local-factory story plus four numbered reasons. */
export default function Features() {
  return (
    <section id="why" className="scroll-mt-24 px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Reveal as="p" className="eyebrow">
            Why Wayne Frier of Waycross
          </Reveal>
          <Reveal as="h2" delay={80} className="display mt-5 text-[clamp(2.4rem,4.6vw,3.8rem)]">
            The homes are built here. That&rsquo;s your advantage.
          </Reveal>
          <Reveal as="p" delay={160} className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            Built in Waycross and sold in Waycross. Having the manufacturing facilities nearby means real savings on
            freight and a team that can answer every question, explain your options and help you find the right home for
            your budget.
          </Reveal>
          <Reveal delay={220} className="mt-8">
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-[15px] font-bold tracking-wide text-clay uppercase"
            >
              Our story
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <Reveal variant="reveal-window" delay={200} className="relative mt-10 hidden aspect-[16/10] lg:block">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border-2 border-gold/60" />
            <div className="relative h-full overflow-hidden rounded-2xl">
              <Image
                src="/homes/arlington/0.jpg"
                alt="Front porch of a Live Oak home"
                fill
                sizes="520px"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        <div className="grid content-center gap-5 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={120 + i * 100}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-line bg-white p-7 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-clay/40 hover:shadow-[0_30px_60px_-30px_rgba(13,21,32,0.35)]">
                <span className="display absolute top-5 right-6 text-5xl text-ink/[0.06]">0{i + 1}</span>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-night text-white transition-colors group-hover:bg-clay">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="display mt-6 text-[22px]">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{f.body}</p>
                <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-clay transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
