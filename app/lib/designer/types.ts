/**
 * The shapes behind /homes/<slug>/design.
 *
 * A designer is two halves. The *regions* are generated from
 * `scripts/designer/<slug>.json` by `scripts/designer/build.py`: for each
 * designer photograph, a greyscale mask per surface (siding, cabinets,
 * flooring) and the two numbers the browser needs to relight a new colour
 * into it. The *finishes* a buyer can pick come from Live Oak's décor
 * selection boards (`./liveoak-decor.json`), by the home's series.
 */

/** A paintable surface. One name per thing a buyer would choose. */
export type Material =
  | "siding"
  | "shutters"
  | "cabinets"
  | "island"
  | "counters"
  | "vanity"
  | "vanitytop"
  | "bathwalls"
  | "flooring"
  | "walls";

export type Region = {
  /** Greyscale PNG under `public/`, white where the surface is. */
  mask: string;
  /** Median lightness of the surface in this photograph, 0–1. */
  ref: number;
  /** Its median colour as photographed. */
  asBuilt: string;
};

export type DesignerPhoto = {
  /** The photograph, as a path under `public/`. */
  src: string;
  caption: string;
  width: number;
  height: number;
  cladding?: "smart-panel" | "vinyl";
  /** Whose photograph it is: "Live Oak Homes" for the plant's own photos. */
  credit?: string;
  regions: Partial<Record<Material, Region>>;
};

/** Keyed by the photograph's scene key: `exterior`, `kitchen-3`, `bath`. */
export type DesignerPhotos = Record<string, DesignerPhoto>;

export type Finish = {
  id: string;
  label: string;
  /** Absent on the as-built finish, which leaves the photograph alone. */
  color?: string;
  /** "Standard", "Upgrade", "XT only": the board's own tag. Never a price. */
  tag?: string;
  product?: string;
  /** The board's swatch, as a path under `public/`. */
  swatch?: string;
};

export type MaterialGroup = {
  material: Material;
  /** The question: "Pick the siding color". */
  title: string;
  /** One or two words for the summary: "Siding", "Kitchen cabinets". */
  short: string;
  help?: string;
  section: "Outside" | "Inside";
  /** The first finish is always the home as photographed. */
  finishes: Finish[];
};
