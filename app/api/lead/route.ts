import { readIds, signIds, writeLead } from "../../lib/ghl";
import { FORMS, allQuestions, totalSteps, visible, type FormKind } from "../../lib/lead-steps";
import { site } from "../../lib/site";

/**
 * Both home-page lead forms post here after every step: `form` is "quote" or
 * "financing", `step` 1 is contact details, then one per step of that form.
 * Each post creates or updates the GHL contact (one per person, matched by
 * email/phone), tags it by form and home, and rewrites that form's own note
 * with every answer so far, so a buyer who stops halfway is still captured.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request" }, { status: 400 });
  if (body.company) return Response.json({ ok: true }); // honeypot

  const form = FORMS[(body.form === "financing" ? "financing" : "quote") as FormKind];
  const total = totalSteps(form);
  const clean = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const home = clean(body.home, 120);
  const slug = clean(body.slug, 80).replace(/[^a-z0-9-]/g, "");
  const step = Math.max(1, Math.min(total, Number(body.step) || 1));
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || phone.replace(/\D/g, "").length < 10) {
    return Response.json({ error: "Missing contact details" }, { status: 400 });
  }

  const raw = (body.answers && typeof body.answers === "object" ? body.answers : {}) as Record<string, unknown>;
  const answers: Record<string, string> = {};
  for (const q of allQuestions(form)) {
    const v = clean(raw[q.name], q.input === "textarea" ? 1500 : 400);
    if (!v) continue;
    if (q.choices) {
      const chosen = q.multi ? v.split(", ").filter((c) => q.choices!.includes(c)) : q.choices.includes(v) ? [v] : [];
      if (!chosen.length) continue;
      answers[q.name] = chosen.join(", ");
    } else {
      answers[q.name] = v;
    }
  }
  const answered = allQuestions(form)
    .filter((q) => answers[q.name] && visible(q, answers))
    .map((q) => [q.label, answers[q.name]] as [string, string]);

  const done = step >= total;
  const tags = [
    "website lead",
    form.tag,
    `${form.tag}: ${done ? "completed" : "started"}`,
    ...(slug ? [`home: ${slug}`] : []),
    ...(answers.timeline ? [`timeline: ${answers.timeline.toLowerCase()}`] : []),
  ];

  const page = slug ? `${site.url}/homes/${slug}` : site.url;
  const note = [
    `${form.noteTitle}${home ? `: ${home}` : ""}`,
    done ? "Finished every step." : `Finished step ${step} of ${total} (${form.steps[step - 2]?.title ?? "contact details"}).`,
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
    source: form.source,
    tags,
    answers: answered,
    note,
    contactId: prior?.contactId,
    noteId: prior?.noteId,
  });

  if (typeof result === "string") {
    if (result === "not configured") {
      console.log(`${form.noteTitle} (GHL not configured):`, { step, home, name, email, phone, answers });
      return Response.json({ ok: true });
    }
    console.error(`${form.noteTitle} failed to reach GHL:`, result);
    /* Only the first step must land; later steps should not block the buyer. */
    return step === 1 ? Response.json({ error: "Could not save" }, { status: 502 }) : Response.json({ ok: true });
  }
  return Response.json({ ok: true, token: signIds(result) });
}
