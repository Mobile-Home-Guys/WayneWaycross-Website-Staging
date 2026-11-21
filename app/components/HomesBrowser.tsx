"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { hasDesigner } from "../lib/designer/series";
import { homes, SERIES, type Home, type Section } from "../lib/homes";
import HomeCard from "./HomeCard";

const bedFilters = [
  { label: "All", test: () => true },
  { label: "1–2 beds", test: (b: number) => b <= 2 },
  { label: "3 beds", test: (b: number) => b === 3 },
  { label: "4 beds", test: (b: number) => b === 4 },
  { label: "5 beds", test: (b: number) => b >= 5 },
];

type Option<T> = { label: string; test: (v: T) => boolean };

const sectionFilters: Option<Section | null>[] = [
  { label: "Any type", test: () => true },
  { label: "Single wide", test: (s) => s === "Single wide" },
  { label: "Double wide", test: (s) => s === "Double wide" },
  { label: "Triple wide", test: (s) => s === "Triple wide" },
];

const lotFilters: Option<Home>[] = [
  { label: "All homes", test: () => true },
  { label: "On our lot", test: (h) => h.onLot },
  { label: "Design online", test: (h) => hasDesigner(h.slug) },
];

/** Size buckets shown as tiles above the filters; each sets the home-type filter. */
const buckets = (["Single wide", "Double wide", "Triple wide"] as const).map((section, i) => {
  const list = homes.filter((h) => h.section === section);
  const sizes = list.map((h) => h.sqft);
  return {
    section,
    index: i + 1,
    count: list.length,
    range: list.length
      ? `${Math.min(...sizes).toLocaleString("en-US")}–${Math.max(...sizes).toLocaleString("en-US")} sq ft`
      : "",
  };
});

/** Query values the home page links with, e.g. /homes?type=double or /homes?show=lot. */
const typeParam: Record<string, number> = { single: 1, double: 2, triple: 3 };
const showParam: Record<string, number> = { lot: 1, design: 2 };

const seriesFilters: Option<Home["series"]>[] = [
  { label: "Any series", test: () => true },
  ...SERIES.map((s) => ({ label: s, test: (list: Home["series"]) => list.includes(s) })),
];

const bathFilters: Option<number>[] = [
  { label: "Any baths", test: () => true },
  { label: "1 bath", test: (b) => b < 2 },
  { label: "2–2.5 baths", test: (b) => b >= 2 && b < 3 },
  { label: "3+ baths", test: (b) => b >= 3 },
];

const sqftFilters: Option<number>[] = [
  { label: "Any size", test: () => true },
  { label: "Under 1,000 sq ft", test: (s) => s < 1000 },
  { label: "1,000–1,499 sq ft", test: (s) => s >= 1000 && s < 1500 },
  { label: "1,500–1,999 sq ft", test: (s) => s >= 1500 && s < 2000 },
  { label: "2,000+ sq ft", test: (s) => s >= 2000 },
];

const selectClass =
  "border-0 border-b-2 border-line-strong bg-band px-3 py-2.5 text-[15px] font-medium text-ink outline-none focus:border-clay";

/** Pill-shaped dropdown for one filter; index 0 is always "any". */
function FilterSelect<T>({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: Option<T>[];
  value: number;
  onChange: (i: number) => void;
}) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${selectClass} ${value ? "!border-clay text-clay" : ""}`}
      >
        {options.map((o, i) => (
          <option key={o.label} value={i}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  );
}

const sorts: Record<string, { label: string; fn: (a: Home, b: Home) => number }> = {
  name: { label: "Name", fn: (a, b) => a.name.localeCompare(b.name) },
  small: { label: "Smallest first", fn: (a, b) => a.sqft - b.sqft },
  large: { label: "Largest first", fn: (a, b) => b.sqft - a.sqft },
};

const noSubscribe = () => () => {};

/** Filterable grid of every home model on the lot. */
export default function HomesBrowser() {
  const [beds, setBeds] = useState(0);
  const [sectionPick, setSection] = useState<number | null>(null);
  const [series, setSeries] = useState(0);
  const [baths, setBaths] = useState(0);
  const [sqft, setSqft] = useState(0);
  const [lotPick, setLot] = useState<number | null>(null);
  const [sort, setSort] = useState("name");

  // A filter the home page linked with, read after hydration so the prerendered list stays the full one.
  // The visitor's own pick, once made, wins over it.
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const query = new URLSearchParams(search);
  const section = sectionPick ?? typeParam[query.get("type") ?? ""] ?? 0;
  const lot = lotPick ?? showParam[query.get("show") ?? ""] ?? 0;

  const list = useMemo(
    () =>
      homes
        .filter(
          (h) =>
            bedFilters[beds].test(h.beds) &&
            sectionFilters[section].test(h.section) &&
            seriesFilters[series].test(h.series) &&
            bathFilters[baths].test(h.baths) &&
            sqftFilters[sqft].test(h.sqft) &&
            lotFilters[lot].test(h),
        )
        .sort(sorts[sort].fn),
    [beds, section, series, baths, sqft, lot, sort],
  );

  const filtered = beds || section || series || baths || sqft || lot;
  const clear = () => {
    setBeds(0);
    setSection(0);
    setSeries(0);
    setBaths(0);
    setSqft(0);
    setLot(0);
  };

  return (
    <>
      <div className="mb-8 grid grid-cols-3 gap-3 md:gap-4" role="group" aria-label="Shop by size">
        {buckets.map((b) => {
          const on = section === b.index;
          return (
            <button
              key={b.section}
              type="button"
              aria-pressed={on}
              onClick={() => setSection(on ? 0 : b.index)}
              className={`flex flex-col items-center border-2 px-2 py-4 text-center transition-colors md:py-5 ${
                on ? "border-clay bg-blush" : "border-line bg-white hover:border-clay"
              }`}
            >
              <span className="text-lg font-bold tracking-[0.04em] text-ink uppercase [font-family:var(--font-condensed)] md:text-xl">
                {b.section}
              </span>
              <span className="mt-1 text-[13px] text-muted">
                {b.count} homes<span className="hidden sm:inline"> · {b.range}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-b border-line pb-6 lg:flex-row">
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by bedrooms">
          {bedFilters.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setBeds(i)}
              aria-pressed={beds === i}
              className={`spec px-4 py-2 text-[15px] tracking-[0.04em] uppercase transition-colors ${
                beds === i ? "bg-clay text-white" : "border-2 border-line bg-white text-ink hover:border-clay hover:text-clay"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="More filters">
          <FilterSelect id="lot" label="Show" options={lotFilters} value={lot} onChange={setLot} />
          <FilterSelect id="section" label="Filter by home type" options={sectionFilters} value={section} onChange={setSection} />
          <FilterSelect id="series" label="Filter by home series" options={seriesFilters} value={series} onChange={setSeries} />
          <FilterSelect id="baths" label="Filter by bathrooms" options={bathFilters} value={baths} onChange={setBaths} />
          <FilterSelect id="sqft" label="Filter by square feet" options={sqftFilters} value={sqft} onChange={setSqft} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-5 text-sm text-muted">
        <div className="flex items-center gap-3">
          <span aria-live="polite">
            {list.length} {list.length === 1 ? "home" : "homes"}
          </span>
          {filtered ? (
            <button onClick={clear} className="font-medium text-clay underline-offset-4 hover:underline">
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="sort">
            Sort homes
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={selectClass}
          >
            {Object.entries(sorts).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {list.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((h) => (
            <HomeCard key={h.slug} home={h} heading="h2" sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-muted">
          No homes match those filters.{" "}
          <button onClick={clear} className="font-medium text-clay underline-offset-4 hover:underline">
            Clear filters
          </button>
        </p>
      )}
    </>
  );
}
