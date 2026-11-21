import { designableRooms } from "./designable.generated";

/**
 * Which homes get the designer and which Live Oak décor board each uses. Kept apart from
 * index.ts so client components can check `hasDesigner` without bundling the photo masks.
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

/** True when a home has a designer, without loading its masks. */
export const hasDesigner = (slug: string) => !!DESIGNER_SERIES[slug] && !!designableRooms[slug];
