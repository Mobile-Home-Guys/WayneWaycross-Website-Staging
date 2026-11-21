"use client";

/* eslint-disable @next/next/no-img-element -- swatches are tiny static crops; next/image adds nothing here */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { DesignerPhotos, Finish, Material, MaterialGroup } from "../lib/designer/types";
import { site } from "../lib/site";
import { ArrowRight, Check, ChevronDown, SendIcon } from "./Icons";

/**
 * The home designer, one surface at a time: "Pick the siding color", the
 * surface lit up on the photo, the board's colours to tap, Next. Then the
 * whole design and a name and number, sent to the sales team with the picks.
 *
 * Each photograph comes with a greyscale mask per surface. A new colour is
 * relit into the masked pixels from the photograph's own lightness, the
 * ratio of each pixel to the surface's median, so shadows, grain and window
 * light stay the photograph's. The recolour is the Westgate Home Center
 * designer's (same Live Oak plant); the screens are this site's own.
 * Nothing leaves the page but the picks, and only when the buyer sends them.
 */

type Loaded = {
  base: Uint8ClampedArray<ArrayBuffer>;
  lum: Float32Array;
  masks: Partial<Record<Material, Uint8Array>>;
  w: number;
  h: number;
};

type Picks = Partial<Record<Material, string>>;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });

function readPixels(img: HTMLImageElement): Uint8ClampedArray<ArrayBuffer> {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height).data;
}

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const PAINTED = new Set<Material>(["cabinets", "island", "vanity", "walls", "bathwalls", "shutters"]);

/**
 * The home with a design's finishes laid into one photograph, as RGBA. Each
 * new colour is relit from the photograph: the pixel's lightness against
 * the surface's median carries the shadow, grain and window light. A dark
 * finish multiplied down loses that detail, so it is added back instead;
 * the two blend by the finish's own lightness so there is no seam.
 */
function paint(P: Loaded, photo: DesignerPhotos[string], groups: MaterialGroup[], picks: Picks): Uint8ClampedArray<ArrayBuffer> {
  const b = P.base;
  const L = P.lum;
  const o = new Uint8ClampedArray(b);
  for (const g of groups) {
    const finish = g.finishes.find((f) => f.id === picks[g.material]);
    const mask = P.masks[g.material];
    const region = photo.regions[g.material];
    if (!finish?.color || !mask || !region) continue;
    const t = hexToRgb(finish.color);
    const ref = region.ref;
    const tl = 0.299 * t[0] + 0.587 * t[1] + 0.114 * t[2];
    const w = tl < 0.18 ? 1 : tl > 0.42 ? 0 : (0.42 - tl) / 0.24;
    /* A near-black surface carries mostly sensor noise in its lightness;
       turned light, that noise would read as speckle, so its shading is
       kept at reduced strength. */
    let k = ref >= 0.35 ? 1 : Math.max(0.3, ref / 0.35);
    /* Paint covers grain: a painted surface turned lighter than it was keeps
       the light and shadow but loses most of the old wood's figure. Floors
       and counters keep their pattern; that is the material. */
    if (PAINTED.has(g.material) && tl > ref) k *= Math.max(0.35, Math.sqrt(ref / tl));
    for (let i = 0, j = 0; i < mask.length; i++, j += 4) {
      const a = mask[i];
      if (!a) continue;
      const f = a / 255;
      const l = L[i];
      let q = 1 + (l / ref - 1) * k;
      q = q < 0.3 ? 0.3 : q > 1.5 ? 1.5 : q;
      const d = (l - ref) * 0.85;
      const r = t[0] * q * (1 - w) + (t[0] + d) * w;
      const gg = t[1] * q * (1 - w) + (t[1] + d) * w;
      const bb = t[2] * q * (1 - w) + (t[2] + d) * w;
      o[j] = b[j] * (1 - f) + clamp01(r) * 255 * f;
      o[j + 1] = b[j + 1] * (1 - f) + clamp01(gg) * 255 * f;
      o[j + 2] = b[j + 2] * (1 - f) + clamp01(bb) * 255 * f;
    }
  }
  return o;
}

/** A surface lit up: the rest of the photo dimmed so the eye goes to it. */
function spotlight(o: Uint8ClampedArray, mask: Uint8Array, amount: number) {
  for (let i = 0, j = 0; i < mask.length; i++, j += 4) {
    const dim = 1 - amount * (1 - mask[i] / 255);
    o[j] *= dim;
    o[j + 1] *= dim;
    o[j + 2] *= dim;
  }
}

const buyerTypes = [
  "First-time home buyer",
  "I have land, need a home",
  "I need a home & land",
  "Upgrading my current home",
  "Investor",
];

const field =
  "h-13 w-full rounded-2xl border border-line bg-white px-4 text-[16px] text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-clay";

export default function HomeDesigner({
  slug,
  name,
  series,
  photos,
  groups,
}: {
  slug: string;
  name: string;
  series: string;
  photos: DesignerPhotos;
  groups: MaterialGroup[];
}) {
  const photoKeys = useMemo(() => Object.keys(photos), [photos]);
  const storageKey = `designer:${slug}`;
  const [picks, setPicks] = useState<Picks>({});
  /* One step per surface, then the review-and-send step. */
  const [step, setStep] = useState(0);
  const onReview = step >= groups.length;
  const group = onReview ? undefined : groups[step];
  const [photoKey, setPhotoKey] = useState(photoKeys[0]);
  const [original, setOriginal] = useState(false);
  const [spot, setSpot] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const canvas = useRef<HTMLCanvasElement>(null);
  const cache = useRef<Record<string, Promise<Loaded>>>({});
  const [ready, setReady] = useState<string | null>(null);

  /* Picks saved on this device, so a reload keeps the design. */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Picks;
      const valid: Picks = {};
      for (const g of groups) {
        const id = saved[g.material];
        if (id && g.finishes.some((f) => f.id === id)) valid[g.material] = id;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once on mount from the browser
      setPicks(valid);
    } catch {
      /* storage blocked */
    }
  }, [storageKey, groups]);

  const choose = (m: Material, id: string) => {
    const next = { ...picks, [m]: id };
    setPicks(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
  };

  const load = useCallback(
    (key: string) => {
      if (!cache.current[key]) {
        const p = photos[key];
        cache.current[key] = (async () => {
          const img = await loadImage(p.src);
          const base = readPixels(img);
          const n = img.naturalWidth * img.naturalHeight;
          const lum = new Float32Array(n);
          for (let i = 0, j = 0; i < n; i++, j += 4)
            lum[i] = (0.299 * base[j] + 0.587 * base[j + 1] + 0.114 * base[j + 2]) / 255;
          const masks: Loaded["masks"] = {};
          await Promise.all(
            (Object.entries(p.regions) as [Material, { mask: string }][]).map(async ([m, r]) => {
              const d = readPixels(await loadImage(r.mask));
              const a = new Uint8Array(n);
              for (let i = 0, j = 0; i < n; i++, j += 4) a[i] = d[j];
              masks[m] = a;
            }),
          );
          return { base, lum, masks, w: img.naturalWidth, h: img.naturalHeight };
        })();
        cache.current[key].catch(() => delete cache.current[key]);
      }
      return cache.current[key];
    },
    [photos],
  );

  /* Warm the other photographs once the first is on screen. */
  useEffect(() => {
    const t = window.setTimeout(() => photoKeys.forEach((k) => load(k).catch(() => {})), 800);
    return () => window.clearTimeout(t);
  }, [photoKeys, load]);

  /* A new surface: show the photo it is on (the current one if it is there) and light it up. */
  useEffect(() => {
    if (!group) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follow the step to the photo that shows it
    setPhotoKey((k) => (photos[k]?.regions[group.material] ? k : (photoKeys.find((x) => photos[x].regions[group.material]) ?? k)));
    setSpot(1);
    const t = window.setTimeout(() => setSpot(0), 1100);
    return () => window.clearTimeout(t);
  }, [group, photos, photoKeys]);

  /* Draw. */
  useEffect(() => {
    let live = true;
    load(photoKey)
      .then((P) => {
        const c = canvas.current;
        if (!live || !c) return;
        if (c.width !== P.w) c.width = P.w;
        if (c.height !== P.h) c.height = P.h;
        const out = original ? new Uint8ClampedArray(P.base) : paint(P, photos[photoKey], groups, picks);
        const m = group && P.masks[group.material];
        if (spot && m) spotlight(out, m, 0.55);
        c.getContext("2d")!.putImageData(new ImageData(out, P.w, P.h), 0, 0);
        setReady(photoKey);
      })
      .catch(() => live && setReady(null));
    return () => {
      live = false;
    };
  }, [load, photoKey, photos, groups, picks, original, spot, group]);

  const finishOf = (g: MaterialGroup): Finish => g.finishes.find((f) => f.id === picks[g.material]) ?? g.finishes[0];
  const summary = groups.map((g) => `${g.short}: ${finishOf(g).label}`);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          home: `The ${name} (${series} Series)`,
          design: summary.join("; "),
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  const photo = photos[photoKey];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:items-start">
      {/* The photo */}
      <div className="lg:sticky lg:top-28">
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-band">
          <canvas
            ref={canvas}
            role="img"
            aria-label={`${photo.caption} of the ${name}${original ? ", as photographed" : ", with your colors"}`}
            className="block h-auto w-full"
            style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
          />
          {ready !== photoKey && (
            <div className="absolute inset-0 flex items-center justify-center bg-band/70 text-sm font-medium text-muted">
              Loading photo…
            </div>
          )}
          <button
            type="button"
            onPointerDown={() => setOriginal(true)}
            onPointerUp={() => setOriginal(false)}
            onPointerLeave={() => setOriginal(false)}
            onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setOriginal(true)}
            onKeyUp={() => setOriginal(false)}
            className="absolute right-3 bottom-3 rounded-full bg-ink/75 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-ink"
          >
            Hold to see original
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <ul className="flex flex-wrap gap-2" aria-label="Rooms">
            {photoKeys.map((k) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => setPhotoKey(k)}
                  aria-pressed={k === photoKey}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    k === photoKey ? "border-clay bg-clay text-white" : "border-line bg-card text-ink hover:border-clay/40"
                  }`}
                >
                  {photos[k].caption}
                </button>
              </li>
            ))}
          </ul>
          {photo.credit && <p className="text-xs text-muted">Photo: {photo.credit}</p>}
        </div>
      </div>

      {/* The step */}
      <div className="rounded-[28px] border border-line bg-card p-6 sm:p-8">
        <div className="flex gap-1.5" aria-hidden>
          {[...groups, null].map((g, i) => (
            <span key={g?.material ?? "review"} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-clay" : "bg-line"}`} />
          ))}
        </div>
        <p className="mt-4 text-sm font-medium tracking-wide text-clay uppercase">
          {onReview ? "Your design" : `${group!.section} · ${step + 1} of ${groups.length}`}
        </p>

        {group && (
          <>
            <h2 className="display mt-2 text-[clamp(2rem,3.4vw,2.6rem)]">{group.title}</h2>
            {group.help && <p className="mt-2 text-muted">{group.help}</p>}
            <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {group.finishes.map((f) => {
                const on = (picks[group.material] ?? "as-built") === f.id;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => choose(group.material, f.id)}
                      aria-pressed={on}
                      className="group block w-full text-left"
                    >
                      <span
                        className={`relative block aspect-square overflow-hidden rounded-2xl border-2 transition-colors ${
                          on ? "border-clay" : "border-line group-hover:border-clay/40"
                        }`}
                        style={{
                          background: f.color
                            ?? "repeating-linear-gradient(135deg, rgb(0 0 0 / 0.08) 0 2px, transparent 2px 8px), #fff",
                        }}
                      >
                        {f.swatch && <img src={f.swatch} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                        {on && (
                          <span className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-clay text-white">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 block text-sm leading-tight font-medium">{f.label}</span>
                      {f.tag && <span className="block text-xs text-muted">{f.tag}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {onReview && status !== "sent" && (
          <>
            <h2 className="display mt-2 text-[clamp(2rem,3.4vw,2.6rem)]">Your {name}</h2>
            <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white">
              {groups.map((g, i) => {
                const f = finishOf(g);
                return (
                  <li key={g.material}>
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-cream"
                    >
                      <span
                        className="h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-line"
                        style={{ background: f.color ?? "#fff" }}
                      >
                        {f.swatch && <img src={f.swatch} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="flex-1 text-sm text-muted">{g.short}</span>
                      <span className="text-sm font-medium">{f.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 text-muted">
              Send us your design and we&rsquo;ll call you to go over it and give you a quote.
            </p>
            <form onSubmit={send} className="mt-4 space-y-3">
              <input name="name" required autoComplete="name" placeholder="Your name *" aria-label="Your name" className={field} />
              <input name="phone" type="tel" required autoComplete="tel" placeholder="Phone *" aria-label="Phone" className={field} />
              <input name="email" type="email" required autoComplete="email" placeholder="Email *" aria-label="Email" className={field} />
              <div className="relative">
                <select name="buyerType" required defaultValue="" aria-label="What best describes you?" className={`${field} appearance-none pr-12`}>
                  <option value="" disabled>
                    What best describes you? *
                  </option>
                  {buyerTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="flex h-13 w-full items-center justify-center gap-2.5 rounded-full bg-clay font-medium text-white transition-colors hover:bg-clay-dark disabled:opacity-70"
              >
                <SendIcon className="h-5 w-5" />
                {status === "sending" ? "Sending…" : "Send my design"}
              </button>
              {status === "error" && (
                <p role="alert" className="text-center text-sm text-muted">
                  Something went wrong. Please try again or call us at{" "}
                  <a href={site.phoneHref} className="underline underline-offset-4">
                    {site.phone}
                  </a>
                  .
                </p>
              )}
            </form>
          </>
        )}

        {onReview && status === "sent" && (
          <div className="py-8 text-center" role="status">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-clay text-white">
              <Check className="h-7 w-7" />
            </span>
            <p className="display mt-5 text-3xl">Got it, thanks!</p>
            <p className="mt-3 text-muted">
              We&rsquo;ll call you about your {name} soon. Need us sooner? Call{" "}
              <a href={site.phoneHref} className="underline underline-offset-4">
                {site.phone}
              </a>
              .
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full border border-line bg-white px-6 py-3 font-medium text-ink transition-colors hover:border-clay/40 disabled:invisible"
          >
            Back
          </button>
          {!onReview && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="group inline-flex items-center gap-2 rounded-full bg-clay px-7 py-3 font-medium text-white transition-colors hover:bg-clay-dark"
            >
              {step === groups.length - 1 ? "See my design" : "Next"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-muted">
          Colors are from Live Oak Homes&rsquo; {series} Series d&eacute;cor board and are shown on real photos of this
          model. Screens and photos vary a little from the real finish; see samples at our sales center.
        </p>
      </div>
    </div>
  );
}
