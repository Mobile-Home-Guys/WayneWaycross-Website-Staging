import { writeLead } from "../../lib/ghl";

const REQUIRED = ["name", "email", "phone", "buyerType"] as const;
const FIELDS = [...REQUIRED, "budget", "location", "home"] as const;

/**
 * Receives quote requests from the closing-section form, and from the home designer
 * (/homes/<slug>/design), which adds the home and the buyer's picks as `design`.
 * Each lead goes to GHL when the GHL token and location are set (see app/lib/ghl.ts),
 * and to LEAD_WEBHOOK_URL (e.g. a Zapier hook) when that is set.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request" }, { status: 400 });

  const lead: Record<string, string> = {};
  for (const k of FIELDS) lead[k] = String(body[k] ?? "").trim().slice(0, 300);
  const design = String(body.design ?? "").trim().slice(0, 2000);
  if (design) lead.design = design;
  if (REQUIRED.some((k) => !lead[k]) || !/^\S+@\S+\.\S+$/.test(lead.email)) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const fromDesigner = Boolean(lead.design);
  const ghl = await writeLead({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: fromDesigner ? "Website – Home Designer" : "Website – Quote Form",
    tags: ["website lead", fromDesigner ? "home designer" : "quote form"],
    answers: [
      ["What best describes you?", lead.buyerType],
      ["What's your budget?", lead.budget],
    ],
    note: [
      fromDesigner ? `Website lead – Home designer: ${lead.home}\n` : "Website lead – Quote form\n",
      `Name: ${lead.name}`,
      `Phone: ${lead.phone}`,
      `Email: ${lead.email}`,
      `What best describes you? ${lead.buyerType}`,
      lead.budget && `Budget: ${lead.budget}`,
      lead.location && `Location: ${lead.location}`,
      lead.home && !fromDesigner && `Home: ${lead.home}`,
      lead.design && `Design picks: ${lead.design}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
  if (typeof ghl === "string" && ghl !== "not configured") console.error("Quote lead failed to reach GHL:", ghl);
  const savedInGhl = typeof ghl !== "string";

  const hook = process.env.LEAD_WEBHOOK_URL;
  if (!hook) {
    if (!savedInGhl) console.log("Quote request (no GHL or LEAD_WEBHOOK_URL):", lead);
    return savedInGhl || ghl === "not configured"
      ? Response.json({ ok: true })
      : Response.json({ error: "Could not deliver lead" }, { status: 502 });
  }

  const res = await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...lead, source: "waynefrierwaycross.com", submittedAt: new Date().toISOString() }),
  }).catch(() => null);
  if (!res?.ok && !savedInGhl) return Response.json({ error: "Could not deliver lead" }, { status: 502 });
  return Response.json({ ok: true });
}
