"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { getContact, getServerContact, setContact, subscribeContact } from "../lib/contact-store";
import { FORMS, picks, totalSteps, visible, type FormKind, type Question } from "../lib/lead-steps";
import { site } from "../lib/site";
import { ArrowRight, Check, PhoneIcon } from "./Icons";

const field =
  "h-13 w-full border-0 border-b-2 border-line-strong bg-white px-4 text-[16px] text-ink placeholder:text-muted outline-none transition-colors focus:border-clay";

const COPY: Record<
  FormKind,
  {
    anchor: string;
    intro: (home: string) => string;
    start: string;
    finish: string;
    thanks: (home: string) => string;
    after: (home: string) => string;
    other: { href: string; label: (home: string) => string };
  }
> = {
  quote: {
    anchor: "quote",
    intro: (home) => `Tell us where to reach you, then a few quick taps so we can put together a real quote on the ${home}.`,
    start: "Start my quote",
    finish: "Send my quote request",
    thanks: (home) => `Your quote request for the ${home} is in.`,
    after: (home) =>
      `Someone from our team will reach out shortly with pricing on the ${home}, delivery and setup for your spot. Need us sooner?`,
    other: { href: "#financing", label: () => "Request financing info too" },
  },
  financing: {
    anchor: "financing",
    intro: () => "Tell us where to reach you, then a few quick financing questions so our team can call you with real options.",
    start: "Next",
    finish: "Send my financing request",
    thanks: () => "Your financing request is in.",
    after: () =>
      "A member of our team will reach out to talk through your financing options. Financing is subject to lender approval. Need us sooner?",
    other: { href: "#quote", label: (home) => `Get a quote on the ${home}` },
  },
};

/**
 * Multi-step lead form for a home page: "quote" or "financing". The financing form also runs on its
 * own /financing page with no `home`; it then sends no home or slug and links to the quote form instead. Step 1 takes
 * name, phone and email (shared between both forms); every Next after that
 * saves the answers so far to GHL through /api/lead.
 */
export default function HomeLeadForm({
  kind,
  home,
  slug,
  designable,
}: {
  kind: FormKind;
  home?: string;
  slug?: string;
  designable?: boolean;
}) {
  const form = FORMS[kind];
  const copy = COPY[kind];
  const other = home ? copy.other : { href: "/contact#contact", label: () => "Get a free quote" };
  const total = totalSteps(form);
  const contact = useSyncExternalStore(subscribeContact, getContact, getServerContact);
  const [company, setCompany] = useState("");
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string>();
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [missing, setMissing] = useState(false);
  const done = step > total;
  const current = form.steps[step - 2];
  const questions = current ? current.questions.filter((q) => visible(q, answers)) : [];

  async function save(next: number) {
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: kind,
          ...contact,
          company,
          home: home ? `The ${home}` : "",
          slug: slug ?? "",
          step,
          answers,
          token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      if (data.token) setToken(data.token);
      setStatus("idle");
      setStep(next);
      document.getElementById(copy.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setStatus("error");
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (current && questions.some((q) => q.required && !answers[q.name]?.trim())) {
      setMissing(true);
      return;
    }
    setMissing(false);
    void save(step + 1);
  }

  const pick = (q: Question, v: string) =>
    setAnswers((a) => {
      if (q.multi) {
        const now = picks(a[q.name]);
        const next = now.includes(v) ? now.filter((c) => c !== v) : [...now, v];
        return { ...a, [q.name]: q.choices!.filter((c) => next.includes(c)).join(", ") };
      }
      return { ...a, [q.name]: a[q.name] === v && !q.required ? "" : v };
    });
  const first = contact.name.trim().split(/\s+/)[0];

  if (done) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-clay text-white">
          <Check className="h-7 w-7" />
        </span>
        <p className="display mt-6 text-3xl">
          Thanks{first ? `, ${first}` : ""}! {copy.thanks(home ?? "")}
        </p>
        <p className="mt-3 max-w-md text-muted">{copy.after(home ?? "")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <a href={site.phoneHref} className="btn btn-red px-7 py-4">
            <PhoneIcon className="h-4 w-4" />
            Call {site.phone}
          </a>
          <a href={other.href} className="btn btn-outline bg-white px-7 py-4">
            {other.label(home ?? "")}
          </a>
          {designable && home && kind === "quote" && (
            <Link href={`/homes/${slug}/design`} className="btn btn-outline bg-white px-7 py-4">
              Design the {home} while you wait
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate={!!current} className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-sm font-medium text-muted">
          <span>
            Step {step} of {total}
            {current ? ` · ${current.title}` : " · Your details"}
          </span>
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="underline underline-offset-4 hover:text-ink">
              Back
            </button>
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden bg-line" aria-hidden>
          <div className="h-full bg-clay transition-all" style={{ width: `${((step - 1) / total) * 100}%` }} />
        </div>
        <p className="mt-4 text-muted">{current ? current.lede : copy.intro(home ?? "")}</p>
      </div>

      {!current ? (
        <div className="space-y-3.5">
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="Your Name *"
            aria-label="Your name"
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
            className={field}
          />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <input
              name="phone"
              type="tel"
              required
              minLength={10}
              autoComplete="tel"
              placeholder="Phone *"
              aria-label="Phone"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              className={field}
            />
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email *"
              aria-label="Email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              className={field}
            />
          </div>
          <input
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="absolute -left-[9999px] h-px w-px opacity-0"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => (
            <fieldset key={q.name}>
              <legend className="text-[17px] font-semibold text-ink">
                {q.label}
                {!q.required && <span className="ml-2 text-sm font-normal text-muted">Optional</span>}
              </legend>
              {q.hint && <p className="mt-1 text-sm text-muted">{q.hint}</p>}
              {q.choices ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.choices.map((c) => {
                    const on = q.multi ? picks(answers[q.name]).includes(c) : answers[q.name] === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={on}
                        onClick={() => pick(q, c)}
                        className={`inline-flex items-center gap-1.5 border-2 px-4 py-2.5 text-[15px] font-medium transition-colors ${
                          on ? "border-clay bg-clay text-white" : "border-line-strong bg-white text-ink hover:border-clay"
                        } ${missing && q.required && !answers[q.name] ? "border-clay/60" : ""}`}
                      >
                        {q.multi && on && <Check className="h-4 w-4" />}
                        {c}
                      </button>
                    );
                  })}
                </div>
              ) : q.input === "textarea" ? (
                <textarea
                  rows={3}
                  aria-label={q.label}
                  value={answers[q.name] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.name]: e.target.value })}
                  className={`${field} mt-3 h-auto py-3`}
                />
              ) : (
                <input
                  aria-label={q.label}
                  value={answers[q.name] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.name]: e.target.value })}
                  placeholder={q.placeholder}
                  className={`${field} mt-3`}
                />
              )}
            </fieldset>
          ))}
        </div>
      )}

      {missing && (
        <p role="alert" className="text-sm font-medium text-clay">
          Answer each question that isn&rsquo;t marked optional to keep going.
        </p>
      )}

      <button type="submit" disabled={status === "sending"} className="btn btn-red h-14 w-full text-[18px] disabled:opacity-70">
        {status === "sending" ? "Saving…" : step === total ? copy.finish : step === 1 ? copy.start : "Next"}
        {status !== "sending" && <ArrowRight className="h-5 w-5" />}
      </button>

      {step === 1 && (
        <p className="text-xs leading-relaxed text-muted">
          By sending this, you agree that {site.fullName} may contact you about {home ? "this home" : "your request"} by call, text or email at the
          number and address above. Message and data rates may apply. Reply STOP to opt out of texts.
        </p>
      )}
      {kind === "financing" && (
        <p className="text-xs leading-relaxed text-muted">
          This is not a credit application and won&rsquo;t affect your credit. A team member will follow up to talk through
          your options. All financing is subject to lender approval.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-center text-sm text-clay">
          Something went wrong. Please try again or call us at{" "}
          <a href={site.phoneHref} className="underline underline-offset-4">
            {site.phone}
          </a>
          .
        </p>
      )}
    </form>
  );
}
