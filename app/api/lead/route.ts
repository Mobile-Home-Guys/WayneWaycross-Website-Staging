import { readIds, signIds, writeLead } from "../../lib/ghl";
import { ALL_QUESTIONS, STEPS, TOTAL_STEPS, visible } from "../../lib/lead-steps";
import { site } from "../../lib/site";

/**
 * The "Get this home" form posts here after every step (`step` 1 = contact
 * details, then one per entry in STEPS). Each post creates or updates the
 * GHL contact and rewrites one note with every answer so far, so a buyer who
 * stops halfway is still captured.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request" }, { status: 400 });
  if (body.company) return Response.json({ ok: true }); // honeypot

  const clean = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const home = clean(body.home, 120);
  const slug = clean(body.slug, 80).replace(/[^a-z0-9-]/g, "");
  const step = Math.max(1, Math.min(TOTAL_STEPS, Number(body.step) || 1));
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || phone.replace(/\D/g, "").length < 10) {
    return Response.json({ error: "Missing contact details" }, { status: 400 });
  }

  const raw = (body.answers && typeof body.answers === "object" ? body.answers : {}) as Record<string, unknown>;
  const answers: Record<string, string> = {};
  for (const q of ALL_QUESTIONS) {
    const v = clean(raw[q.name], q.input === "textarea" ? 1500 : 200);
    if (!v) continue;
    if (q.choices && !q.choices.includes(v)) continue;
    answers[q.name] = v;
  }
  const answered = ALL_QUESTIONS.filter((q) => answers[q.name] && visible(q, answers)).map(
    (q) => [q.label, answers[q.name]] as [string, string],
  );

  const done = step >= TOTAL_STEPS;
  const homeTag = slug ? `home: ${slug}` : undefined;
  const tags = [
    "website lead",
    "get this home",
    done ? "get this home: completed" : "get this home: started",
    ...(homeTag ? [homeTag] : []),
    ...(answers.timeline ? [`timeline: ${answers.timeline.toLowerCase()}`] : []),
  ];

  const page = slug ? `${site.url}/homes/${slug}` : site.url;
  const note = [
    `Website lead – Get this home${home ? `: ${home}` : ""}`,
    done ? "Finished every step." : `Finished step ${step} of ${TOTAL_STEPS} (${STEPS[step - 2]?.title ?? "contact details"}).`,
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    ...answered.map(([label, value]) => `${label} ${value}`),
    "",
    `Page: ${page}`,
  ].join("\n");

  const prior = readIds(body.token);
  const result = await writeLead({
    name,
    email,
    phone,
    source: "Website – Get This Home",
    tags,
    answers: answered,
    note,
    contactId: prior?.contactId,
    noteId: prior?.noteId,
  });

  if (typeof result === "string") {
    if (result === "not configured") {
      console.log("Get-this-home lead (GHL not configured):", { step, home, name, email, phone, answers });
      return Response.json({ ok: true });
    }
    console.error("Get-this-home lead failed to reach GHL:", result);
    /* Only the first step must land; later steps should not block the buyer. */
    return step === 1 ? Response.json({ error: "Could not save" }, { status: 502 }) : Response.json({ ok: true });
  }
  return Response.json({ ok: true, token: signIds(result) });
}
