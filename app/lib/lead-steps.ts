/**
 * The "Get this home" form on every home page: easy questions first, harder
 * ones later. Each Next saves what the buyer has answered so far to GHL
 * (`app/api/lead/route.ts`), so a buyer who stops halfway is still a lead.
 *
 * Questions follow the Korte Homes buyer profile, trimmed for a home-page
 * form. No age question, and income is asked without benefit types, to keep
 * clear of fair-lending trouble. Budget ranges are the buyer's own budget;
 * the site never shows a home's price.
 */

export type Question = {
  /** Key sent to the API and used for tags/fields. */
  name: string;
  label: string;
  hint?: string;
  required: boolean;
  /** Tap answers; absent for a typed answer. */
  choices?: string[];
  input?: "text" | "textarea";
  /** Asked only when this returns true for the answers so far. */
  showIf?: (a: Record<string, string>) => boolean;
};

export type Step = { key: string; title: string; lede: string; questions: Question[] };

export const buyerTypes = [
  "First-time home buyer",
  "I have land, need a home",
  "I need a home & land",
  "Upgrading my current home",
  "Investor",
];

const OWN_LAND = "My own land";

export const STEPS: Step[] = [
  {
    key: "timing",
    title: "Timing",
    lede: "Two taps. It helps us know how fast to move for you.",
    questions: [
      {
        name: "timeline",
        label: "When are you hoping to move in?",
        required: true,
        choices: ["As soon as possible", "1–3 months", "3–6 months", "6+ months", "Just looking"],
      },
      { name: "buyerType", label: "What best describes you?", required: true, choices: buyerTypes },
      {
        name: "reason",
        label: "Who is the home for?",
        required: true,
        choices: ["Me / my family", "A second home", "A family member", "An investment"],
      },
    ],
  },
  {
    key: "land",
    title: "Where it's going",
    lede: "Where the home goes shapes delivery, setup and financing.",
    questions: [
      {
        name: "placement",
        label: "Where will the home go?",
        required: true,
        choices: [OWN_LAND, "Land I'm buying", "A community or park", "I need land", "Not sure yet"],
      },
      {
        name: "landPaidOff",
        label: "Is your land paid off?",
        required: true,
        choices: ["Yes, free & clear", "Still paying it off"],
        showIf: (a) => a.placement === OWN_LAND,
      },
      {
        name: "landDownPayment",
        label: "Would you like to use your land as your down payment?",
        hint: "Land you own outright can often stand in for cash down.",
        required: true,
        choices: ["Yes", "No", "Not sure"],
        showIf: (a) => a.placement === OWN_LAND && a.landPaidOff === "Yes, free & clear",
      },
      { name: "location", label: "What city or county will the home go in?", required: true, input: "text" },
    ],
  },
  {
    key: "paying",
    title: "Paying for it",
    lede: "Rough answers are fine. This points you at the right homes and the right lender.",
    questions: [
      { name: "payment", label: "How do you plan to pay?", required: true, choices: ["Financing", "Cash", "Not sure yet"] },
      {
        name: "budget",
        label: "What's your budget?",
        required: true,
        choices: ["Under $60k", "$60k – $100k", "$100k – $150k", "$150k – $200k", "$200k+", "Not sure"],
      },
      {
        name: "monthly",
        label: "What monthly payment feels comfortable?",
        required: true,
        choices: ["Under $800", "$800 – $1,200", "$1,200 – $1,600", "Over $1,600", "Not sure"],
        showIf: (a) => a.payment !== "Cash",
      },
      { name: "tradeIn", label: "Do you have a home to trade in?", required: true, choices: ["Yes", "No"] },
    ],
  },
  {
    key: "credit",
    title: "Last few",
    lede: "Kept between you and our team. It lets us line up a lender before you fall in love with a home.",
    questions: [
      {
        name: "income",
        label: "What's your main source of income?",
        required: false,
        choices: ["Employed", "Self-employed", "Retired", "Fixed income", "Other"],
      },
      {
        name: "credit",
        label: "How would you rate your credit?",
        hint: "A guess is fine.",
        required: false,
        choices: ["750+", "700 – 749", "650 – 699", "600 – 649", "Under 600", "Not sure"],
      },
      {
        name: "history",
        label: "Any foreclosure, repossession or eviction in the last few years?",
        required: false,
        choices: ["None", "Foreclosure", "Repossession", "Eviction", "Prefer not to say"],
      },
      {
        name: "bestTime",
        label: "Best time to reach you?",
        required: false,
        choices: ["Morning", "Afternoon", "Evening", "Anytime"],
      },
      { name: "notes", label: "Anything else we should know?", required: false, input: "textarea" },
    ],
  },
];

/** Contact details are step 0, typed rather than tapped. */
export const TOTAL_STEPS = STEPS.length + 1;

export const ALL_QUESTIONS = STEPS.flatMap((s) => s.questions);

export const visible = (q: Question, a: Record<string, string>) => !q.showIf || q.showIf(a);
