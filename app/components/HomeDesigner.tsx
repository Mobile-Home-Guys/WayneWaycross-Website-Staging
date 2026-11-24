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
 * Each photograph comes with a greyscale mask per surface. A new finish is
 * relit into the masked pixels from the photograph's own lightness, the
 * ratio of each pixel to the surface's median, so shadows and window light
 * stay the photograph's. Paint and siding are one colour; wood, stone and
 * wall panels are drawn with the Live Oak board's own sample (grain, veins,
 * weave) in place of the photograph's, so Grizzly Oak looks like Grizzly Oak
 * and not like orange paint. The recolour started as the Westgate Home
 * Center designer's (same Live Oak plant); the screens are this site's own.
 * Nothing leaves the page but the picks, and only when the buyer sends them.
 */

type Loaded = {
  base: Uint8ClampedArray<ArrayBuffer>;
  lum: Float32Array;
  /** The lightness softened a few pixels: the light without the old grain. */
  soft: Float32Array;
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

/** A board sample, ready to lay down: its pixels (0–1), size and mean colour. */
type Texture = { px: Float32Array; w: number; h: number; mean: [number, number, number]; hi: number };

/** A box blur, run twice: close to a soft gaussian, in two passes per run. */
function soften(src: Float32Array, w: number, h: number, r: number): Float32Array {
  let a = src;
  for (let pass = 0; pass < 2; pass++) {
    const t = new Float32Array(a.length);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        t[row + x] = acc / (2 * r + 1);
        acc += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    const o = new Float32Array(a.length);
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += t[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        o[y * w + x] = acc / (2 * r + 1);
        acc += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x];
      }
    }
    a = o;
  }
  return a;
}

/** The 95th percentile of a surface's lightness against its median, from a histogram. */
function brightEnd(shade: Float32Array, mask: Uint8Array, ref: number): number {
  const bins = new Uint32Array(300);
  let n = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] < 128) continue;
    const v = Math.min(299, Math.floor((shade[i] / ref) * 100));
    bins[v]++;
    n++;
  }
  let seen = 0;
  for (let v = 0; v < 300; v++) {
    seen += bins[v];
    if (seen >= n * 0.95) return (v + 0.5) / 100;
  }
  return 1;
}

/**
 * The home with a design's finishes laid into one photograph, as RGBA. Each
 * new finish is relit from the photograph: the pixel's lightness against
 * the surface's median carries the shadow and window light. A finish with a
 * board pattern takes the pattern from the board and only the light from the
 * photograph (its old grain mostly softened away); a flat finish keeps the
 * photograph's texture. The light is held back where it would push a pale
 * finish past white, so White reads white and not grey. A dark finish
 * multiplied down loses its detail, so it is added back instead; the two
 * blend by the finish's own lightness so there is no seam.
 */
function paint(
  P: Loaded,
  photo: DesignerPhotos[string],
  groups: MaterialGroup[],
  picks: Picks,
  textures: Record<string, Texture>,
): Uint8ClampedArray<ArrayBuffer> {
  const b = P.base;
  const o = new Uint8ClampedArray(b);
  for (const g of groups) {
    const finish = g.finishes.find((f) => f.id === picks[g.material]);
    const mask = P.masks[g.material];
    const region = photo.regions[g.material];
    if (!finish?.color || !mask || !region) continue;
    const tex = finish.texture ? textures[finish.texture.src] : undefined;
    /* The finish's colour is the board's (its swatch's median); a pattern
       only varies around it, so the overall colour stays the board's. */
    const t = hexToRgb(finish.color);
    const ref = region.ref;
    const tl = 0.299 * t[0] + 0.587 * t[1] + 0.114 * t[2];
    const w = tl < 0.18 ? 1 : tl > 0.42 ? 0 : (0.42 - tl) / 0.24;
    /* With a board pattern the photograph's own grain mostly goes: keep the
       light (the softened lightness) and only `detail` of the old pattern. */
    const keep = tex ? finish.texture!.detail : 1;
    const shade = keep === 1 ? P.lum : new Float32Array(P.lum.length);
    if (keep !== 1) for (let i = 0; i < shade.length; i++) shade[i] = P.soft[i] + (P.lum[i] - P.soft[i]) * keep;
    /* A near-black surface carries mostly sensor noise in its lightness;
       turned light, that noise would read as speckle, so its shading is
       kept at reduced strength. */
    let k = ref >= 0.35 ? 1 : Math.max(0.3, ref / 0.35);
    /* Paint covers grain: a painted surface turned lighter than it was keeps
       the light and shadow but loses most of the old wood's figure. */
    if (!tex && PAINTED.has(g.material) && tl > ref) k *= Math.max(0.35, Math.sqrt(ref / tl));
    /* The board shows each finish in even light: keep the room's light a
       little softer than the photograph's, and never so strong that the
       sunlit part of a pale finish clips to a different, greyer colour. */
    k *= 0.85;
    const top = Math.max(t[0], t[1], t[2]) * (tex ? tex.hi / Math.max(...tex.mean) : 1);
    const q95 = brightEnd(shade, mask, ref);
    if (q95 > 1 && top * (1 + (q95 - 1) * k) > 0.98) k = Math.max(0.25, Math.min(k, (0.98 / top - 1) / (q95 - 1)));
    const amp = tex ? finish.texture!.amp : 0;
    for (let i = 0, j = 0; i < mask.length; i++, j += 4) {
      const a = mask[i];
      if (!a) continue;
      const f = a / 255;
      const l = shade[i];
      let q = 1 + (l / ref - 1) * k;
      q = q < 0.3 ? 0.3 : q > 1.5 ? 1.5 : q;
      const d = (l - ref) * 0.85;
      let c0 = t[0],
        c1 = t[1],
        c2 = t[2];
      if (tex) {
        const x = i % P.w;
        const y = (i - x) / P.w;
        const ti = ((y % tex.h) * tex.w + (x % tex.w)) * 3;
        c0 *= 1 + (tex.px[ti] / tex.mean[0] - 1) * amp;
        c1 *= 1 + (tex.px[ti + 1] / tex.mean[1] - 1) * amp;
        c2 *= 1 + (tex.px[ti + 2] / tex.mean[2] - 1) * amp;
      }
      const r = c0 * q * (1 - w) + (c0 + d) * w;
      const gg = c1 * q * (1 - w) + (c1 + d) * w;
      const bb = c2 * q * (1 - w) + (c2 + d) * w;
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
  const texCache = useRef<Record<string, Promise<Texture>>>({});
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
          const soft = soften(lum, img.naturalWidth, img.naturalHeight, 3);
          const masks: Loaded["masks"] = {};
          await Promise.all(
            (Object.entries(p.regions) as [Material, { mask: string }][]).map(async ([m, r]) => {
              const d = readPixels(await loadImage(r.mask));
              const a = new Uint8Array(n);
              for (let i = 0, j = 0; i < n; i++, j += 4) a[i] = d[j];
              masks[m] = a;
            }),
          );
          return { base, lum, soft, masks, w: img.naturalWidth, h: img.naturalHeight };
        })();
        cache.current[key].catch(() => delete cache.current[key]);
      }
      return cache.current[key];
    },
    [photos],
  );

  /* A board pattern, read once into numbers the paint loop can sample. */
  const loadTexture = useCallback((src: string) => {
    if (!texCache.current[src]) {
      texCache.current[src] = loadImage(src).then((img) => {
        const d = readPixels(img);
        const n = img.naturalWidth * img.naturalHeight;
        const px = new Float32Array(n * 3);
        const mean: [number, number, number] = [0, 0, 0];
        const tops: number[] = [];
        for (let i = 0, j = 0; i < n; i++, j += 4) {
          for (let c = 0; c < 3; c++) {
            px[i * 3 + c] = d[j + c] / 255;
            mean[c] += d[j + c] / 255 / n;
          }
          tops.push(Math.max(px[i * 3], px[i * 3 + 1], px[i * 3 + 2]));
        }
        tops.sort((x, y) => x - y);
        return { px, w: img.naturalWidth, h: img.naturalHeight, mean, hi: tops[Math.floor(n * 0.9)] };
      });
      texCache.current[src].catch(() => delete texCache.current[src]);
    }
    return texCache.current[src];
  }, []);

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
    const srcs = [
      ...new Set(
        groups.flatMap((g) => {
          const t = g.finishes.find((f) => f.id === picks[g.material])?.texture;
          return t ? [t.src] : [];
        }),
      ),
    ];
    Promise.all([load(photoKey), Promise.all(srcs.map((s) => loadTexture(s)))])
      .then(([P, loaded]) => {
        const c = canvas.current;
        if (!live || !c) return;
        if (c.width !== P.w) c.width = P.w;
        if (c.height !== P.h) c.height = P.h;
        const textures = Object.fromEntries(srcs.map((s, i) => [s, loaded[i]]));
        const out = original ? new Uint8ClampedArray(P.base) : paint(P, photos[photoKey], groups, picks, textures);
        const m = group && P.masks[group.material];
        if (spot && m) spotlight(out, m, 0.55);
        c.getContext("2d")!.putImageData(new ImageData(out, P.w, P.h), 0, 0);
        setReady(photoKey);
      })
      .catch(() => live && setReady(null));
    return () => {
      live = false;
    };
  }, [load, loadTexture, photoKey, photos, groups, picks, original, spot, group]);

  const finishOf = (g: MaterialGroup): Finish => g.finishes.find((f) => f.id === picks[g.material]) ?? g.finishes[0];
  /* The photograph's own finish may not be one Wayne Frier offers (the
     photos come from the plant and other lots), so leaving a surface as
     photographed is sent as "not chosen", never as a finish. */
  const chosen = (g: MaterialGroup) => !!finishOf(g).color;
  const summary = groups.map((g) => `${g.short}: ${chosen(g) ? finishOf(g).label : "not chosen"}`);

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
        <div className="relative overflow-hidden rounded-2xl border border-line bg-band">
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
                  className={`rounded-lg border px-4 py-1.5 text-sm font-bold transition-colors ${
                    k === photoKey ? "border-night bg-night text-white" : "border-line bg-card text-ink hover:border-clay/40"
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
      <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgba(13,21,32,0.45)] sm:p-8">
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
                      <span className={`text-sm font-medium ${chosen(g) ? "" : "text-muted"}`}>
                        {chosen(g) ? f.label : "Not chosen yet"}
                      </span>
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
                className="flex h-13 w-full items-center justify-center gap-2.5 rounded-lg bg-clay font-bold text-white transition-colors hover:bg-clay-dark disabled:opacity-70"
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
            className="rounded-lg border border-ink/15 bg-white px-6 py-3 font-bold text-ink transition-colors hover:border-clay/40 disabled:invisible"
          >
            Back
          </button>
          {!onReview && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="group inline-flex items-center gap-2 rounded-lg bg-clay px-7 py-3 font-bold text-white transition-colors hover:bg-clay-dark"
            >
              {step === groups.length - 1 ? "See my design" : "Next"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-muted">
          Colors are from Live Oak Homes&rsquo; {series}{" "}Series d&eacute;cor board and are shown on real photos of this
          model. Screens and photos vary a little from the real finish; see samples at our sales center.
        </p>
      </div>
    </div>
  );
}
