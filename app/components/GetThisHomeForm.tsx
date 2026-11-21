"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { STEPS, TOTAL_STEPS, visible, type Question } from "../lib/lead-steps";
import { site } from "../lib/site";
import { ArrowRight, Check, PhoneIcon } from "./Icons";

const field =
  "h-13 w-full border-0 border-b-2 border-line-strong bg-white px-4 text-[16px] text-ink placeholder:text-muted outline-none transition-colors focus:border-clay";

/**
 * Multi-step "Get this home" form. Step 1 takes name, phone and email; every
 * Next after that saves the answers so far to GHL through /api/lead.
 */
export default function GetThisHomeForm({
  home,
  slug,
  designable,
}: {
  home: string;
  slug: string;
  designable: boolean;
}) {
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", company: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string>();
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [missing, setMissing] = useState(false);
  const done = step > TOTAL_STEPS;
  const current = STEPS[step - 2];
  const questions = current ? current.questions.filter((q) => visible(q, answers)) : [];

  async function save(next: number) {
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contact, home: `The ${home}`, slug, step, answers, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      if (data.token) setToken(data.token);
      setStatus("idle");
      setStep(next);
      document.getElementById("get-this-home")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const pick = (q: Question, v: string) => setAnswers((a) => ({ ...a, [q.name]: a[q.name] === v && !q.required ? "" : v }));
  const first = contact.name.trim().split(/\s+/)[0];

  if (done) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-clay text-white">
          <Check className="h-7 w-7" />
        </span>
        <p className="display mt-6 text-3xl">Thanks{first ? `, ${first}` : ""}! The {home} is on our list for you.</p>
        <p className="mt-3 max-w-md text-muted">
          Someone from our team will reach out shortly to go over the {home}, delivery and financing. Need us sooner?
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={site.phoneHref} className="btn btn-red px-7 py-4">
            <PhoneIcon className="h-4 w-4" />
            Call {site.phone}
          </a>
          {designable && (
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
            Step {step} of {TOTAL_STEPS}
            {current ? ` · ${current.title}` : " · Your details"}
          </span>
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="underline underline-offset-4 hover:text-ink">
              Back
            </button>
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden bg-line" aria-hidden>
          <div className="h-full bg-clay transition-all" style={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }} />
        </div>
        <p className="mt-4 text-muted">
          {current ? current.lede : `Tell us where to reach you and we'll check availability, delivery and options on the ${home}.`}
        </p>
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
            value={contact.company}
            onChange={(e) => setContact({ ...contact, company: e.target.value })}
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
                    const on = answers[q.name] === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={on}
                        onClick={() => pick(q, c)}
                        className={`border-2 px-4 py-2.5 text-[15px] font-medium transition-colors ${
                          on ? "border-clay bg-clay text-white" : "border-line-strong bg-white text-ink hover:border-clay"
                        } ${missing && q.required && !answers[q.name] ? "border-clay/60" : ""}`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              ) : q.input === "textarea" ? (
                <textarea
                  rows={3}
                  value={answers[q.name] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.name]: e.target.value })}
                  className={`${field} mt-3 h-auto py-3`}
                />
              ) : (
                <input
                  value={answers[q.name] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.name]: e.target.value })}
                  placeholder="e.g. Ware County"
                  className={`${field} mt-3`}
                />
              )}
            </fieldset>
          ))}
        </div>
      )}

      {missing && (
        <p role="alert" className="text-sm font-medium text-clay">
          Pick an answer for each question to keep going.
        </p>
      )}

      <button type="submit" disabled={status === "sending"} className="btn btn-red h-14 w-full text-[18px] disabled:opacity-70">
        {status === "sending" ? "Saving…" : step === TOTAL_STEPS ? "Finish" : step === 1 ? `Get the ${home}` : "Next"}
        {status !== "sending" && <ArrowRight className="h-5 w-5" />}
      </button>

      {step === 1 && (
        <p className="text-xs leading-relaxed text-muted">
          By sending this, you agree that {site.fullName} may contact you about this home by call, text or email at the
          number and address above. Message and data rates may apply. Reply STOP to opt out of texts.
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
