#!/usr/bin/env python3
"""
Cut the designer's surfaces out of a home's photographs with a
segmentation model, so a recolour follows the real edge of a cabinet door
or a countertop instead of a hand-drawn approximation.

    python3 scripts/designer/segment.py <slug> [<slug> …]   # one or more homes
    python3 scripts/designer/segment.py                     # every home with prompts
    python3 scripts/designer/segment.py <slug> --debug      # also writes .segment-debug/<slug>-<photo>.jpg

A region in `scripts/designer/<slug>.json` opts in with prompts, in the
photograph's own pixels:

    "counters": {
      "sam":   [{"box": [x0, y0, x1, y1], "pos": [[x, y]], "neg": [[x, y]]}],
      "minus": [{"box": [...]}],        # things standing in front: stools, a tray, a lamp
      "plus":    [[[x, y], …]],         # polygons added as they are — a flat wall traces cleaner than it cuts
      "exclude": [[[x, y], …]],         # polygons that are never this surface
      "within":  [[[x, y], …]],         # optional: clip the result to these polygons
      "minusRegions": ["island"]        # optional: never overlap these regions of the same photo
    }

Each prompt is a box around one piece of the surface (one run of counter,
one bank of cabinets) with optional points on it (`pos`) and off it (`neg`).
The pieces are unioned, the `minus` objects and `exclude` polygons taken
away, and the result written to `scripts/designer/seg/<slug>/<photo>-<region>.png`.
`build.py` then uses that file as the region's mask — so the
build itself needs only OpenCV, and this script (and its model) is needed
only when a home's prompts change.

The model is EfficientSAM-S (Apache-2.0), fetched once from GitHub into
`.cache/efficientsam`. With `pip install torch torchvision` it runs the S
model; without torch it falls back to the smaller Ti model on onnxruntime.
"""
import json, subprocess, sys, zipfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent.parent
SPECS = ROOT / "scripts" / "designer"
SEG = SPECS / "seg"
CACHE = ROOT / ".cache" / "efficientsam"
REPO = "https://github.com/yformer/EfficientSAM.git"


def fetch():
    if not (CACHE / "efficient_sam").exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "-q", "--depth", "1", REPO, str(CACHE)], check=True)


def load_model():
    """EfficientSAM-S on torch when it is installed; else EfficientSAM-Ti on onnxruntime."""
    fetch()
    try:
        import torch  # noqa: F401
    except ImportError:
        import onnxruntime as ort

        w = CACHE / "weights"
        print("  (torch not installed: using EfficientSAM-Ti on onnxruntime — `pip install torch torchvision` for the S model)")
        return ("onnx", ort.InferenceSession(str(w / "efficient_sam_vitt_encoder.onnx")), ort.InferenceSession(str(w / "efficient_sam_vitt_decoder.onnx")))
    weights = CACHE / "weights" / "efficient_sam_vits.pt"
    if not weights.exists():
        with zipfile.ZipFile(CACHE / "weights" / "efficient_sam_vits.pt.zip") as z:
            z.extractall(CACHE / "weights")
    sys.path.insert(0, str(CACHE))
    from efficient_sam.build_efficient_sam import build_efficient_sam

    return ("torch", build_efficient_sam(encoder_patch_embed_dim=384, encoder_num_heads=6, checkpoint=str(weights)).eval())


def polys(shape, ps):
    im = Image.new("L", (shape[1], shape[0]), 0)
    d = ImageDraw.Draw(im)
    for p in ps or []:
        d.polygon([tuple(x) for x in p], fill=255)
    return np.asarray(im) > 0


class Photo:
    """
    A photograph and the model. The model sees 1024 px and answers on a
    256-cell grid, so a cut of the whole frame puts eight photo pixels in a
    cell at 2,000 px wide: cabinet corners come back rounded and edges wobble.
    Each box is therefore cut from a crop around it, encoded on its own, so
    the grid covers the piece rather than the room — a few pixels a cell.
    """

    def __init__(self, model, path):
        self.model = model
        self.rgb = np.asarray(Image.open(path).convert("RGB"))
        self.h, self.w = self.rgb.shape[:2]
        self.cache = {}

    def embed(self, x0, y0, x1, y1):
        key = (x0, y0, x1, y1)
        if key not in self.cache:
            x = self.rgb[y0:y1, x0:x1].transpose(2, 0, 1)[None].astype(np.float32) / 255
            if self.model[0] == "onnx":
                (e,) = self.model[1].run(None, {"batched_images": x})
            else:
                import torch

                with torch.no_grad():
                    e = self.model[1].get_image_embeddings(torch.from_numpy(x))
            self.cache[key] = e
        return self.cache[key]

    def predict(self, emb, pts, lab, h, w):
        """Three candidate masks (logits) and their predicted IoU."""
        P = np.array([[pts]], np.float32)
        Lb = np.array([[lab]], np.float32)
        if self.model[0] == "onnx":
            logits, iou, _ = self.model[2].run(
                None,
                {
                    "image_embeddings": emb,
                    "batched_point_coords": P,
                    "batched_point_labels": Lb,
                    "orig_im_size": np.array([h, w], np.int64),
                },
            )
            return logits[0, 0], iou[0, 0]
        import torch

        with torch.no_grad():
            logits, iou = self.model[1].predict_masks(
                emb, torch.from_numpy(P), torch.from_numpy(Lb), multimask_output=True,
                input_h=h, input_w=w, output_h=h, output_w=w,
            )
        return logits[0, 0].numpy(), iou[0, 0].numpy()

    def frame(self, prompt):
        """The crop a prompt is cut from: its box and a margin, or the whole photo."""
        if "box" not in prompt or not prompt.get("zoom", ZOOM):
            return 0, 0, self.w, self.h
        x0, y0, x1, y1 = prompt["box"]
        m = max(32, int(0.18 * max(x1 - x0, y1 - y0)))
        X0, Y0, X1, Y1 = max(0, x0 - m), max(0, y0 - m), min(self.w, x1 + m), min(self.h, y1 + m)
        # Enlarging only pays when the crop is well under the model's 1024 px.
        if (X1 - X0) * (Y1 - Y0) > 0.6 * self.w * self.h:
            return 0, 0, self.w, self.h
        return X0, Y0, X1, Y1

    def cut(self, prompt):
        """One prompt → one boolean mask at the photograph's size."""
        X0, Y0, X1, Y1 = self.frame(prompt)
        pts, lab = [], []
        if "box" in prompt:
            x0, y0, x1, y1 = prompt["box"]
            pts += [[x0 - X0, y0 - Y0], [x1 - X0, y1 - Y0]]
            lab += [2, 3]
        for p in prompt.get("pos", []):
            pts.append([p[0] - X0, p[1] - Y0]), lab.append(1)
        for p in prompt.get("neg", []):
            pts.append([p[0] - X0, p[1] - Y0]), lab.append(0)
        logits, iou = self.predict(self.embed(X0, Y0, X1, Y1), pts, lab, Y1 - Y0, X1 - X0)
        pick = prompt.get("pick")
        i = int(pick) if pick is not None else int(np.argmax(iou))
        m = np.zeros((self.h, self.w), bool)
        m[Y0:Y1, X0:X1] = logits[i] > float(prompt.get("thresh", 0.0))
        if "box" in prompt:
            # A box prompt never reaches outside its box (plus a little slack for the edge).
            x0, y0, x1, y1 = prompt["box"]
            s = int(prompt.get("slack", 3))
            clip = np.zeros_like(m)
            clip[max(0, y0 - s) : y1 + s + 1, max(0, x0 - s) : x1 + s + 1] = True
            m &= clip
        return m


# Surfaces that are straight-edged in the world: their cut is fitted to
# straight lines snapped onto the photograph's own edges (see `rectify`).
ZOOM = "--zoom" in sys.argv
RECT = "--rect" in sys.argv  # experimental: straight-edge fitting, still being tuned

RECTILINEAR = {"cabinets", "island", "vanity", "door", "siding", "accent", "skirting", "shutters", "counters", "vanitytop"}


def _turn(a, b, c):
    """The angle, in degrees, a path turns through at b."""
    u, v = b - a, c - b
    nu, nv = np.hypot(*u), np.hypot(*v)
    if nu < 1e-6 or nv < 1e-6:
        return 0.0
    return float(np.degrees(np.arccos(np.clip(np.dot(u, v) / (nu * nv), -1, 1))))


def _intersect(p, d, q, e):
    """Where the lines p + t·d and q + s·e cross, or None when they are near parallel."""
    den = d[0] * e[1] - d[1] * e[0]
    if abs(den) < 0.15:
        return None
    t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den
    return p + t * d


def rectify(m, photo, merge_deg=16.0, snap=6.0, band=24):
    """
    A cut of a straight-edged surface, made straight. The model's outline is
    reduced to the corners where it really turns (wobble along an edge turns
    by a few degrees and goes; a rounded corner becomes the sharp one its two
    edges meet at), each edge is refitted to the outline it replaced, then
    slid up to `snap` px onto the strongest straight edge in the photograph —
    integrated along the whole edge, so a faint shadow line between a white
    cabinet and a white wall still wins. Nothing moves more than `band` px.
    """
    import cv2

    if not hasattr(photo, "grad"):
        g = cv2.GaussianBlur(photo.rgb.astype(np.float32).mean(2) / 255, (0, 0), 1.0)
        photo.grad = (cv2.Scharr(g, cv2.CV_32F, 1, 0) / 16, cv2.Scharr(g, cv2.CV_32F, 0, 1) / 16)
    gx, gy = photo.grad
    m8 = m.astype(np.uint8)
    cs, hier = cv2.findContours(m8, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    if not cs:
        return m
    S = 4  # supersampled raster, for an antialiased edge
    canvas = np.zeros((m.shape[0] * S, m.shape[1] * S), np.uint8)
    order = sorted(range(len(cs)), key=lambda i: hier[0][i][3] != -1)  # outlines first, then holes
    for i in order:
        c = cs[i][:, 0, :].astype(np.float64)
        hole = hier[0][i][3] != -1
        if len(c) < 12 or cv2.contourArea(cs[i]) < 150:
            if not hole:
                cv2.fillPoly(canvas, [np.round(c * S).astype(np.int32)], 255)
            continue
        dp = cv2.approxPolyDP(cs[i], 2.5, True)[:, 0, :]
        idx = {tuple(p): k for k, p in enumerate(c.astype(int))}
        keep = sorted({idx[tuple(p)] for p in dp if tuple(p) in idx})
        # Drop the vertex that turns least, again and again, while it turns little.
        while len(keep) > 3:
            P = c[keep]
            turns = [_turn(P[k - 1], P[k], P[(k + 1) % len(P)]) for k in range(len(P))]
            k = int(np.argmin(turns))
            if turns[k] >= merge_deg:
                break
            keep.pop(k)
        # Each edge refitted to the outline points it stands for.
        lines = []
        for k in range(len(keep)):
            a, b = keep[k], keep[(k + 1) % len(keep)]
            seg = c[a : b + 1] if a < b else np.vstack([c[a:], c[: b + 1]])
            if len(seg) < 2:
                seg = np.vstack([c[a], c[b]])
            ctr = seg.mean(0)
            u, sv, vt = np.linalg.svd(seg - ctr)
            d = vt[0]
            lines.append([ctr, d, seg])
        # Short edges between two long ones are a rounded corner: let the long ones meet.
        changed = True
        while changed and len(lines) > 3:
            changed = False
            for k in range(len(lines)):
                L = len(lines[k][2])
                prv, nxt = lines[k - 1], lines[(k + 1) % len(lines)]
                if L < 0.25 * min(len(prv[2]), len(nxt[2])) and L < 40:
                    x = _intersect(prv[0], prv[1], nxt[0], nxt[1])
                    if x is not None and np.hypot(*(x - lines[k][0])) < 45:
                        lines.pop(k)
                        changed = True
                        break
        # Slide each edge onto the photograph's edge.
        for ln in lines:
            ctr, d, seg = ln
            if len(seg) < 3 * snap:
                continue
            n = np.array([-d[1], d[0]])
            t = (seg - ctr) @ d
            ts = np.linspace(t.min() + 0.12 * np.ptp(t), t.max() - 0.12 * np.ptp(t), max(8, int(np.ptp(t) * 0.8)))
            best, score0 = 0.0, None
            scores = []
            for o in np.arange(-snap, snap + 0.01, 0.5):
                pts = ctr + ts[:, None] * d + o * n
                X = pts[:, 0].astype(np.float32).reshape(1, -1)
                Y = pts[:, 1].astype(np.float32).reshape(1, -1)
                sx = cv2.remap(gx, X, Y, cv2.INTER_LINEAR)
                sy = cv2.remap(gy, X, Y, cv2.INTER_LINEAR)
                sc = abs(float(np.mean(sx * n[0] + sy * n[1]))) * (1 - 0.03 * abs(o))
                scores.append((sc, o))
                if o == 0:
                    score0 = sc
            sc, o = max(scores)
            if sc > 0.004 and sc > 1.15 * (score0 or 0):
                ln[0] = ctr + o * n
        pts = []
        for k in range(len(lines)):
            p, d = lines[k - 1][0], lines[k - 1][1]
            q, e = lines[k][0], lines[k][1]
            x = _intersect(p, d, q, e)
            start = lines[k][2][0]
            if x is None or np.hypot(*(x - start)) > band:
                x = start
            pts.append(x)
        poly = np.round(np.array(pts) * S).astype(np.int32)
        cv2.fillPoly(canvas, [poly], 0 if hole else 255, lineType=cv2.LINE_AA)
    r = cv2.resize(canvas, (m.shape[1], m.shape[0]), interpolation=cv2.INTER_AREA) > 127
    # Never more than `band` px from the model's own outline.
    d_out = cv2.distanceTransform((~m).astype(np.uint8), cv2.DIST_L2, 3)
    d_in = cv2.distanceTransform(m8, cv2.DIST_L2, 3)
    return np.where(r & ~m, d_out <= band, np.where(m & ~r, d_in > band, r)) | (m & r)


def region(photo, rule, name=""):
    m = np.zeros((photo.h, photo.w), bool)
    for p in rule["sam"]:
        m |= photo.cut(p)
    if rule.get("rect", RECT and name in RECTILINEAR):
        m = rectify(m, photo)
    # A flat plane (a plain wall) is often cleaner traced than cut: `plus`
    # polygons are added to whatever the model found.
    if rule.get("plus"):
        m |= polys(m.shape, rule["plus"])
    for p in rule.get("minus", []):
        m &= ~photo.cut(p)
    if rule.get("within"):
        m &= polys(m.shape, rule["within"])
    m &= ~polys(m.shape, rule.get("exclude"))
    return m


COLORS = [(0, 160, 255), (255, 0, 140), (255, 210, 0), (255, 110, 0), (110, 255, 0), (170, 80, 255), (0, 255, 200)]


def run(model, spec_path, debug=False):
    spec = json.loads(spec_path.read_text())
    slug = spec["slug"]
    out = SEG / slug
    did = False
    for name, p in spec["photos"].items():
        rules = {k: r for k, r in p["regions"].items() if r.get("sam")}
        if not rules:
            continue
        did = True
        out.mkdir(parents=True, exist_ok=True)
        rel = p.get("src") or next(
            f"/designer/{slug}/{name}.{e}"
            for e in ("webp", "jpg", "png")
            if (ROOT / "public" / "designer" / slug / f"{name}.{e}").exists()
        )
        photo = Photo(model, ROOT / "public" / rel.lstrip("/"))
        over = photo.rgb.astype(float)
        raw = {k: region(photo, r, k) for k, r in rules.items()}
        for i, (k, r) in enumerate(rules.items()):
            m = raw[k].copy()
            for other in r.get("minusRegions", []):
                m &= ~raw[other]
            Image.fromarray((m * 255).astype("uint8")).save(out / f"{name}-{k}.png", optimize=True)
            print(f"  {slug}/{name} {k}: {m.mean():.1%} of frame")
            c = np.array(COLORS[i % len(COLORS)], float)
            over[m] = over[m] * 0.45 + c * 0.55
        if debug:
            d = ROOT / ".segment-debug"
            d.mkdir(exist_ok=True)
            Image.fromarray(over.astype("uint8")).resize((photo.w * 2, photo.h * 2)).save(d / f"{slug}-{name}.jpg", quality=85)
    return did


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    paths = [SPECS / f"{a}.json" for a in args] if args else sorted(SPECS.glob("*.json"))
    model = load_model()
    for p in paths:
        if not run(model, p, "--debug" in sys.argv):
            print(f"  {p.stem}: no prompts")


if __name__ == "__main__":
    main()
