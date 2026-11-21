import decor from "./liveoak-decor.json";
import { designableRooms } from "./designable.generated";
import { designerRegions } from "./regions.generated";
import type { DesignerPhotos, Finish, Material, MaterialGroup } from "./types";

export type { DesignerPhotos, Finish, Material, MaterialGroup } from "./types";

/**
 * The home designer's data: which homes get one, and what a buyer can pick.
 *
 * Source: Live Oak Homes' two "Décor Options Selection Board" PDFs (XT &
 * Xtreme Series, Oak Series) and Jay Harvard's CURRENT STOCK INVENTORY list,
 * both from Jay's "Current Inventory" email (Nov 20, 2026). The boards were
 * turned into `liveoak-decor.json` (swatches cropped from the boards, colour
 * = the swatch's median) for the Westgate Home Center site, which sells
 * from the same Live Oak plant; the file is shared as is.
 *
 * Jay's rules: XT and Extreme homes take the XT & Xtreme board, Oak homes
 * the Oak board. Finishes the board marks "XT only" are offered on XT homes
 * only. Suwannee Valley and Super Star homes allow no or very limited
 * changes, so they get no designer. Daytona is on Jay's Extreme list but
 * has no page or photos on this site yet, so it has none either.
 *
 * No prices anywhere: the boards carry none, and none are shown.
 */
export type LiveOakSeries = "Extreme" | "XT" | "Oak";

export const DESIGNER_SERIES: Record<string, LiveOakSeries> = {
  tremor: "Extreme",
  laramie: "Extreme",
  silverado: "Extreme",
  "high-country": "Extreme",
  maverick: "Extreme",
  titan: "Extreme",
  raven: "XT",
  dolly: "XT",
  cobblestone: "XT",
  charger: "XT",
  dogwood: "XT",
  highlander: "XT",
  "quail-ridge": "XT",
  defender: "Oak",
  horizon: "Oak",
  "georgia-giant": "Oak",
  ace: "Oak",
  slugger: "Oak",
};

type BoardFinish = {
  id: string;
  label: string;
  product: string;
  swatch: string;
  color: string;
  tag?: string;
  xtOnly?: boolean;
};
type Board = Record<string, BoardFinish[]>;
const BOARDS = (decor as unknown as { boards: Record<"xt-extreme" | "oak", Board> }).boards;

const SWATCHES = "/designer/swatches/";

/** Each surface: the question, a line saying what it is, and which board list it takes. */
const SURFACES: {
  material: Material;
  title: string;
  short: string;
  help?: string;
  section: MaterialGroup["section"];
  list: (series: LiveOakSeries) => string;
}[] = [
  { material: "siding", title: "Pick the siding color", short: "Siding", help: "The main color of the outside.", section: "Outside", list: () => "siding" },
  { material: "shutters", title: "Pick the shutter color", short: "Shutters", help: "The panels beside the windows.", section: "Outside", list: () => "shutters" },
  { material: "cabinets", title: "Pick the kitchen cabinets", short: "Kitchen cabinets", section: "Inside", list: () => "cabinets" },
  { material: "counters", title: "Pick the kitchen countertop", short: "Countertop", section: "Inside", list: () => "counters" },
  { material: "island", title: "Pick the island top", short: "Island top", help: "The top of the kitchen island.", section: "Inside", list: () => "island" },
  { material: "flooring", title: "Pick the floor", short: "Floor", help: "One floor runs through the rooms shown.", section: "Inside", list: () => "flooring" },
  {
    material: "walls",
    title: "Pick the wall color",
    short: "Walls",
    help: "Living areas and bedrooms.",
    section: "Inside",
    list: (s) => (s === "Oak" ? "wallPanels" : "paint"),
  },
  { material: "vanity", title: "Pick the bathroom cabinets", short: "Bathroom cabinets", section: "Inside", list: () => "cabinets" },
  { material: "vanitytop", title: "Pick the bathroom countertop", short: "Bathroom countertop", section: "Inside", list: () => "counters" },
  {
    material: "bathwalls",
    title: "Pick the bathroom wall color",
    short: "Bathroom walls",
    section: "Inside",
    list: (s) => (s === "Oak" ? "wallPanels" : "paint"),
  },
];

/** The photographs and masks for one home, or undefined if it has no designer. */
export function designerFor(slug: string): DesignerPhotos | undefined {
  return DESIGNER_SERIES[slug] ? designerRegions[slug] : undefined;
}

/** Homes with a designer. */
export const designerSlugs = (): string[] => Object.keys(designerRegions).filter((s) => DESIGNER_SERIES[s]);

/** True when a home has a designer, without loading its masks. */
export const hasDesigner = (slug: string) => !!DESIGNER_SERIES[slug] && !!designableRooms[slug];

/**
 * The surfaces a home's photographs can show, each with the finishes its
 * series' board offers. The first finish is the home as photographed.
 */
export function groupsFor(slug: string, photos: DesignerPhotos): MaterialGroup[] {
  const series = DESIGNER_SERIES[slug];
  if (!series) return [];
  const board = BOARDS[series === "Oak" ? "oak" : "xt-extreme"];
  const present = new Set<Material>();
  for (const p of Object.values(photos)) for (const m of Object.keys(p.regions) as Material[]) present.add(m);
  return SURFACES.filter((s) => present.has(s.material)).flatMap((s) => {
    const offered: Finish[] = (board[s.list(series)] ?? [])
      .filter((f) => series === "XT" || !f.xtOnly)
      .map((f) => ({
        id: f.id,
        label: f.label,
        product: f.product,
        tag: f.tag,
        color: f.color,
        swatch: SWATCHES + f.swatch.replace(/^swatches\//, ""),
      }));
    if (!offered.length) return [];
    return [
      {
        material: s.material,
        title: s.title,
        short: s.short,
        help: s.help,
        section: s.section,
        finishes: [{ id: "as-built", label: "As photographed" }, ...offered],
      },
    ];
  });
}
