"use client";

import { useState } from "react";

/** Long reviews are long enough to wrap past two lines at the card's width. */
const LONG = 110;

/**
 * A review's words, cut to two lines with a "Read more" toggle when the review runs longer.
 * `hidden` is the ticker's duplicate copy, so its toggle stays out of the tab order.
 */
export default function ReviewText({ text, hidden }: { text: string; hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  const long = text.length > LONG;
  return (
    <div className="mt-4 flex-1">
      <blockquote
        className={`text-[16px] leading-relaxed text-ink-soft ${open ? "" : "line-clamp-2"}`}
      >
        &ldquo;{text}&rdquo;
      </blockquote>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          tabIndex={hidden ? -1 : undefined}
          className="mt-1.5 text-sm font-semibold text-clay underline-offset-4 hover:underline"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
