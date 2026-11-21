#!/usr/bin/env python3
"""
Build the region masks the home designer recolours.

    python3 scripts/designer/build.py              # every spec in scripts/designer/
    python3 scripts/designer/build.py <slug>       # one home
    python3 scripts/designer/build.py <slug> --preview   # also writes .designer-preview.jpg

Ported from the Westgate Home Center site (Mobile-Home-Guys/westgatehomecenter-website,
scripts/build-customizer.py, Nov 2026): Westgate and Waycross sell homes from the same
Live Oak plant, so the specs, cuts and photographs for the homes both sites carry were
taken from there rather than redrawn. Paths are Waycross's.

A spec (`scripts/designer/<slug>.json`) names, for each photograph of the
home, the regions a buyer can change — siding, cabinets, flooring — as
polygons drawn on the photograph plus a colour rule that keeps only the
material inside them (the tan of the siding and not the bush in front of
it). The script writes one greyscale mask per region to
`public/designer/<slug>/<photo>-<region>.png` and the numbers the
browser needs to relight a new colour — each region's median lightness and
its as-built colour — into `app/lib/designer/regions.generated.ts`.

Each photograph is read from `public/designer/<slug>/<photo>.webp`, or the
path a photo names with `"src"` (a photo already in the home's gallery under
`public/homes/<slug>/`). Masks only fit the exact file they were cut on, so a
designer photo is never resized or swapped without re-running the cut.
"""
import json, sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent.parent
SPECS = ROOT / "scripts" / "designer"
OUT_TS = ROOT / "app" / "lib" / "designer" / "regions.generated.ts"
OUT_SLUGS = ROOT / "app" / "lib" / "designer" / "designable.generated.ts"


def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    h = np.zeros_like(mx)
    m = d > 1e-6
    rc = np.where(m, (mx - r) / np.maximum(d, 1e-6), 0)
    gc = np.where(m, (mx - g) / np.maximum(d, 1e-6), 0)
    bc = np.where(m, (mx - b) / np.maximum(d, 1e-6), 0)
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2 + rc - bc, 4 + gc - rc))
    h = np.where(m, (h / 6) % 1, 0)
    return h, s, mx


def polys(shape, ps):
    im = Image.new("L", (shape[1], shape[0]), 0)
    d = ImageDraw.Draw(im)
    for p in ps:
        d.polygon([tuple(x) for x in p], fill=255)
    return np.asarray(im) > 0


def colour_rule(h, s, L, rule):
    """True where a pixel looks like the material by the spec's colour rule."""
    m = np.ones(L.shape, bool)
    if "hue" in rule:
        lo, hi = rule["hue"]
        m &= (h >= lo) & (h <= hi)
    if "notHue" in rule:
        lo, hi, smin = rule["notHue"]
        m &= ~((h >= lo) & (h <= hi) & (s > smin))
    if "sMin" in rule: m &= s >= rule["sMin"]
    if "sMax" in rule: m &= s <= rule["sMax"]
    if "lMin" in rule: m &= L >= rule["lMin"]
    if "lMax" in rule: m &= L <= rule["lMax"]
    return m


def region_mask(a, h, s, L, rule):
    """
    The polygon says roughly where the material is; the colour rule says what
    it looks like. A colour rule alone leaves the mask blotchy wherever the
    material catches light or shadow, so the two seed a graph cut (OpenCV's
    GrabCut) that snaps the mask to the edges actually in the photograph and
    keeps it in one piece. Small holes — a cabinet handle, a knot in the
    siding — are filled, specks are dropped, and the edge is feathered.

    `"refine": false` on a region skips the graph cut, for a material too
    thin for it (a fascia line, a door) where the polygon is already exact.
    """
    import cv2

    H, W = L.shape
    inside = polys(L.shape, rule["include"])
    hard_out = polys(L.shape, rule["exclude"]) if rule.get("exclude") else np.zeros_like(inside)
    inside &= ~hard_out
    looks = colour_rule(h, s, L, rule)
    seed = inside & looks

    if rule.get("refine", True) and seed.sum() > 200:
        k = int(rule.get("snap", 6))
        ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1))
        grown = cv2.dilate(inside.astype(np.uint8), ker) > 0
        core = cv2.erode(seed.astype(np.uint8), ker) > 0
        gc = np.full(L.shape, cv2.GC_BGD, np.uint8)
        gc[grown] = cv2.GC_PR_BGD
        gc[inside] = cv2.GC_PR_FGD
        gc[inside & ~looks] = cv2.GC_PR_BGD
        gc[core] = cv2.GC_FGD
        gc[hard_out] = cv2.GC_BGD
        ys, xs = np.where(grown)
        pad = 12
        y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, H)
        x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, W)
        img = (a[y0:y1, x0:x1] * 255).astype(np.uint8)[..., ::-1].copy()
        sub = gc[y0:y1, x0:x1].copy()
        bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
        try:
            cv2.grabCut(img, sub, None, bgd, fgd, 5, cv2.GC_INIT_WITH_MASK)
            m = np.zeros_like(inside)
            m[y0:y1, x0:x1] = (sub == cv2.GC_FGD) | (sub == cv2.GC_PR_FGD)
        except cv2.error:
            m = seed.copy()
        m &= grown & ~hard_out
        if "lMin" in rule:
            m &= L >= rule["lMin"] - 0.12
        if "lMax" in rule:
            m &= L <= rule["lMax"] + 0.12
    else:
        m = seed.copy()

    # Fill small holes, drop specks.
    m8 = m.astype(np.uint8)
    m8 = cv2.morphologyEx(m8, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    max_hole = int(rule.get("maxHole", max(60, inside.sum() * 0.004)))
    holes = ((1 - m8) & inside.astype(np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(holes, connectivity=4)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] <= max_hole:
            m8[lab == i] = 1
    m8[hard_out] = 0
    min_blob = max(40, int(m8.sum() * 0.004))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m8, connectivity=8)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < min_blob:
            m8[lab == i] = 0
    out = cv2.GaussianBlur((m8 * 255).astype(np.float32), (0, 0), 1.0)
    return Image.fromarray(np.clip(out, 0, 255).astype("uint8"))


COLOUR_KEYS = ("hue", "notHue", "sMin", "sMax", "lMin", "lMax")


def seg_mask(path, rule, h=None, s=None, L=None, guide=None):
    """
    A region cut by `segment.py`: the model has already found the
    edge, so all that is left is to fill pinholes (a cabinet knob, a vein in
    the granite), drop stray specks and soften the edge by a pixel so the
    new colour does not sit on the photograph like a sticker.
    """
    import cv2

    if not path.exists():
        raise SystemExit(f"  ! {path.relative_to(ROOT)} is missing — run scripts/designer/segment.py first")
    m8 = (np.asarray(Image.open(path).convert("L")) > 127).astype(np.uint8)
    # A colour rule on a cut region drops what stands in front of it and looks
    # nothing like it — black chair spindles across a sage island.
    if L is not None and any(k in rule for k in COLOUR_KEYS):
        m8 &= colour_rule(h, s, L, rule).astype(np.uint8)
    max_hole = int(rule.get("maxHole", max(40, m8.sum() * 0.002)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(1 - m8, connectivity=4)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] <= max_hole:
            m8[lab == i] = 1
    min_blob = int(rule.get("minBlob", max(30, m8.sum() * 0.002)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m8, connectivity=8)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < min_blob:
            m8[lab == i] = 0
    if guide is not None:
        return Image.fromarray((snap_edges(guide, m8) * 255).astype("uint8"))
    out = cv2.GaussianBlur((m8 * 255).astype(np.float32), (0, 0), float(rule.get("feather", 0.8)))
    return Image.fromarray(np.clip(out, 0, 255).astype("uint8"))


def snap_edges(gray, m8, r=3, eps=2e-3):
    """
    A guided filter with the photograph as the guide: the cut's edge moves a
    pixel or two onto the photograph's own edge and goes soft exactly where
    the photograph is soft — a cabinet door's bevel, a chair leg's blur —
    instead of a fixed feather. Inside and outside the cut stay as they are.
    """
    import cv2

    k = (2 * r + 1, 2 * r + 1)
    I = gray.astype(np.float32)
    p = m8.astype(np.float32)
    mI, mp = cv2.blur(I, k), cv2.blur(p, k)
    a = (cv2.blur(I * p, k) - mI * mp) / (cv2.blur(I * I, k) - mI * mI + eps)
    b = mp - a * mI
    q = np.clip(cv2.blur(a, k) * I + cv2.blur(b, k), 0, 1)
    ker = np.ones((5, 5), np.uint8)
    q[cv2.erode(m8, ker) > 0] = 1
    q[cv2.dilate(m8, ker) == 0] = 0
    return q


SEG = ROOT / "scripts" / "designer" / "seg"


def photo_src(slug, photo, p):
    """The photograph's path under `public/`, as the site serves it."""
    if p.get("src"):
        return p["src"]
    for ext in ("webp", "jpg", "png"):
        if (ROOT / "public" / "designer" / slug / f"{photo}.{ext}").exists():
            return f"/designer/{slug}/{photo}.{ext}"
    raise SystemExit(f"  ! no photograph for {slug}/{photo}")


def build(spec_path, preview=False):
    spec = json.loads(spec_path.read_text())
    slug = spec["slug"]
    out_dir = ROOT / "public" / "designer" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    result = {}
    tiles = []
    for photo, p in spec["photos"].items():
        rel = photo_src(slug, photo, p)
        src = ROOT / "public" / rel.lstrip("/")
        a = np.asarray(Image.open(src).convert("RGB")).astype(float) / 255
        h, s, _ = rgb_to_hsv(a)
        L = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
        regions = {}
        for name, rule in p["regions"].items():
            img = seg_mask(SEG / slug / f"{photo}-{name}.png", rule, h, s, L, guide=L) if rule.get("sam") else region_mask(a, h, s, L, rule)
            # A traced region (a fascia line, a window casing) never paints over a
            # segmented neighbour: `"minusSeg": ["siding"]` takes the cut siding away.
            for other in rule.get("minusSeg", []):
                cut = np.asarray(Image.open(SEG / slug / f"{photo}-{other}.png").convert("L")) > 127
                # Only what the neighbour actually keeps: siding that drops the black
                # casing round a window leaves that casing to the trim.
                orule = p["regions"].get(other, {})
                if any(k in orule for k in COLOUR_KEYS):
                    cut &= colour_rule(h, s, L, orule)
                img = Image.fromarray((np.asarray(img) * ~cut).astype("uint8"))
            img.save(out_dir / f"{photo}-{name}.png", optimize=True)
            on = np.asarray(img) > 128
            cover = float(on.mean())
            if cover < 0.001:
                print(f"  ! {slug}/{photo} {name}: mask is empty — check the polygon and rule")
            ref = float(np.median(L[on])) if on.any() else 0.5
            rgb = (np.median(a[on], axis=0) * 255).astype(int) if on.any() else np.array([128, 128, 128])
            regions[name] = {
                "mask": f"/designer/{slug}/{photo}-{name}.png",
                "ref": round(ref, 4),
                "asBuilt": "#%02X%02X%02X" % tuple(rgb),
            }
            print(f"  {slug}/{photo} {name}: {cover:.1%} of frame, ref {ref:.3f}")
        result[photo] = {
            "src": rel,
            "caption": p["caption"],
            "width": a.shape[1],
            "height": a.shape[0],
            **({"cladding": p["cladding"]} if p.get("cladding") else {}),
            **({"credit": p["credit"]} if p.get("credit") else {}),
            "regions": regions,
        }
        if preview:
            tiles.append(tint_preview(a, out_dir, photo, regions))
    if preview and tiles:
        w = 700
        rows = [t.resize((w, round(t.height * w / t.width))) for t in tiles]
        sheet = Image.new("RGB", (w * 2, sum(r.height for r in rows[::2]) + 10), "white")
        y = 0
        for i in range(0, len(rows), 2):
            sheet.paste(rows[i], (0, y))
            if i + 1 < len(rows): sheet.paste(rows[i + 1], (w, y))
            y += rows[i].height
        sheet.save(ROOT / ".designer-preview.jpg", quality=82)
    return slug, result


PREVIEW_COLORS = {"siding": (0.42, 0.55, 0.65), "accent": (0.55, 0.42, 0.3), "roof": (0.33, 0.2, 0.16), "trim": (0.15, 0.15, 0.16),
                  "door": (0.55, 0.12, 0.1), "shutters": (0.2, 0.3, 0.25), "skirting": (0.3, 0.31, 0.33), "cabinets": (0.18, 0.25, 0.35), "island": (0.55, 0.15, 0.12), "vanity": (0.18, 0.25, 0.35), "vanitytop": (0.2, 0.2, 0.22), "bathwalls": (0.62, 0.66, 0.6), "counters": (0.2, 0.2, 0.22),
                  "flooring": (0.4, 0.27, 0.17), "walls": (0.62, 0.66, 0.6)}


def tint_preview(a, out_dir, photo, regions):
    L = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    o = a.copy()
    for name, r in regions.items():
        m = np.asarray(Image.open(out_dir / f"{photo}-{name}.png")).astype(float)[..., None] / 255
        t = np.array(PREVIEW_COLORS.get(name, (1, 0, 1)))
        tl = 0.299 * t[0] + 0.587 * t[1] + 0.114 * t[2]
        if tl < 0.3:
            out = np.clip(t + (L - r["ref"])[..., None] * 0.9, 0, 1)
        else:
            out = np.clip(t * np.clip(L / r["ref"], 0.25, 1.6)[..., None], 0, 1)
        o = o * (1 - m) + out * m
    return Image.fromarray((o * 255).astype("uint8"))


def main():
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    preview = "--preview" in sys.argv
    paths = [SPECS / f"{a}.json" for a in args] if args else sorted(SPECS.glob("*.json"))
    existing = {}
    if OUT_TS.exists() and args:
        txt = OUT_TS.read_text()
        start = txt.index("= ") + 2
        existing = json.loads(txt[start:txt.rindex(";")])
    for p in paths:
        slug, res = build(p, preview)
        existing[slug] = res
        for other in json.loads(p.read_text()).get("also", []):
            existing[other] = res
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(
        "/* GENERATED by scripts/designer/build.py from scripts/designer/*.json — do not edit. */\n"
        'import type { DesignerPhotos } from "./types";\n\n'
        "export const designerRegions: Record<string, DesignerPhotos> = "
        + json.dumps(existing, indent=2)
        + ";\n"
    )
    # The slugs alone, with how many rooms each has: tiny, so a page can ask
    # whether a home has a designer without pulling every mask in with it.
    OUT_SLUGS.write_text(
        "/* GENERATED by scripts/designer/build.py — do not edit. Homes with a designer, and how many rooms each designs. */\n"
        "export const designableRooms: Record<string, number> = "
        + json.dumps({k: len(v) for k, v in sorted(existing.items())}, indent=2)
        + ";\n"
    )
    print(f"wrote {OUT_TS.relative_to(ROOT)} ({len(existing)} home{'s' if len(existing) != 1 else ''})")


if __name__ == "__main__":
    main()
