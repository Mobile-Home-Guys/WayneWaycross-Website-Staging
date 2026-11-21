/**
 * The two lead forms on every home page:
 *
 * - "quote": Get a quote on this home. Help-us-help-you questions that let the
 *   team build a real quote (where it's going, land, timeline, add-ons, how
 *   they'll pay). This replaces the earlier "Get this home" form.
 * - "financing": Request financing info. A few financing questions so the team
 *   can call and talk options. Not a credit application.
 *
 * Contact details are always step 1. Each Next saves what the buyer has
 * answered so far to GHL (`app/api/lead/route.ts`), so a buyer who stops
 * halfway is still a lead. Both forms upsert the same GHL contact (matched by
 * email/phone), and each keeps its own running note.
 *
 * Kept out on purpose: age, marital status, anything about protected traits,
 * benefit or income types, SSN, documents. Budget and down-payment ranges are
 * the buyer's own numbers; the site never shows a home's price, and nothing
 * here promises approval or a rate.
 */

export type Question = {
  /** Key sent to the API and used for the note. */
  name: string;
  label: string;
  hint?: string;
  required: boolean;
  /** Tap answers; absent for a typed answer. */
  choices?: string[];
  /** Several taps allowed; the answer is the picks joined with ", ". */
  multi?: boolean;
  input?: "text" | "textarea";
  placeholder?: string;
  /** Asked only when this returns true for the answers so far. */
  showIf?: (a: Record<string, string>) => boolean;
};

export type Step = { key: string; title: string; lede: string; questions: Question[] };

export type FormKind = "quote" | "financing";

export type LeadForm = {
  kind: FormKind;
  /** GHL contact source. */
  source: string;
  /** Base tag; "<tag>: started" / "<tag>: completed" are added too. */
  tag: string;
  /** First line of the GHL note. */
  noteTitle: string;
  steps: Step[];
};

const OWN_LAND = "My own land";

const TIMELINE: Question = {
  name: "timeline",
  label: "When are you hoping to move in?",
  required: true,
  choices: ["As soon as possible", "1–3 months", "3–6 months", "6+ months", "Just looking"],
};

const BEST_TIME: Question = {
  name: "bestTime",
  label: "Best time to reach you?",
  required: false,
  choices: ["Morning", "Afternoon", "Evening", "Anytime"],
};

const NOTES: Question = { name: "notes", label: "Anything else we should know?", required: false, input: "textarea" };

export const ADD_ONS = [
  "Porch or deck",
  "Steps & skirting",
  "Furniture package",
  "Appliance upgrades",
  "Site prep & foundation",
  "Septic, well or utility hookups",
  "Land clearing or driveway",
  "Not sure yet",
];

export const QUOTE: LeadForm = {
  kind: "quote",
  source: "Website – Quote Request",
  tag: "quote request",
  noteTitle: "Website lead – Quote request",
  steps: [
    {
      key: "delivery",
      title: "Where it's going",
      lede: "Delivery and setup depend on where the home goes, so this is the biggest part of your quote.",
      questions: [
        {
          name: "location",
          label: "What county (or city) will the home go in?",
          required: true,
          input: "text",
          placeholder: "e.g. Ware County",
        },
        {
          name: "placement",
          label: "Where will the home sit?",
          required: true,
          choices: [OWN_LAND, "Land I'm buying", "A community or park", "I need land", "Not sure yet"],
        },
        {
          name: "landReady",
          label: "Is the land ready for a home?",
          hint: "Cleared, with power, water and septic nearby.",
          required: false,
          choices: ["Yes, ready to go", "Partly", "No, it needs work", "Not sure"],
          showIf: (a) => a.placement === OWN_LAND || a.placement === "Land I'm buying",
        },
        {
          name: "replacing",
          label: "Is there an older home on the site to remove?",
          required: false,
          choices: ["Yes", "No"],
          showIf: (a) => a.placement === OWN_LAND,
        },
      ],
    },
    {
      key: "timing",
      title: "Timing",
      lede: "Two taps. It tells us how fast to move for you.",
      questions: [
        TIMELINE,
        {
          name: "reason",
          label: "Who is the home for?",
          required: true,
          choices: ["Me / my family", "A second home", "A family member", "An investment"],
        },
      ],
    },
    {
      key: "options",
      title: "Make it yours",
      lede: "Pick anything you'd like priced in. You can change your mind later.",
      questions: [
        {
          name: "addOns",
          label: "What should we include in your quote?",
          hint: "Pick as many as you like.",
          required: false,
          multi: true,
          choices: ADD_ONS,
        },
        { name: "tradeIn", label: "Do you have a home to trade in?", required: true, choices: ["Yes", "No"] },
      ],
    },
    {
      key: "paying",
      title: "Paying for it",
      lede: "Rough answers are fine. It helps us quote the right way from the start.",
      questions: [
        {
          name: "payment",
          label: "How do you plan to pay?",
          required: true,
          choices: ["Cash", "Financing", "Using my land as down payment", "Not sure yet"],
        },
        {
          name: "budget",
          label: "What budget are you working with?",
          hint: "Your total, all in.",
          required: false,
          choices: ["Under $60k", "$60k – $100k", "$100k – $150k", "$150k – $200k", "$200k+", "Not sure"],
        },
        BEST_TIME,
        NOTES,
      ],
    },
  ],
};

export const FINANCING: LeadForm = {
  kind: "financing",
  source: "Website – Financing Request",
  tag: "financing request",
  noteTitle: "Website lead – Financing info request",
  steps: [
    {
      key: "plans",
      title: "Your plans",
      lede: "A few taps so we know what you'd like to finance.",
      questions: [
        TIMELINE,
        {
          name: "financeWhat",
          label: "What would you like to finance?",
          required: true,
          choices: ["The home", "The home and land", "Not sure yet"],
        },
        {
          name: "land",
          label: "Do you have land for the home?",
          required: true,
          choices: [
            "Yes, paid off",
            "Yes, still paying it off",
            "Buying land",
            "A community or park",
            "I need land",
            "Not sure",
          ],
        },
      ],
    },
    {
      key: "money",
      title: "Down payment",
      lede: "Ballpark is fine. It points us to the loan programs that fit.",
      questions: [
        {
          name: "downPayment",
          label: "About how much could you put down?",
          required: true,
          choices: ["Under $5k", "$5k – $10k", "$10k – $20k", "$20k+", "My land", "Not sure"],
        },
        {
          name: "monthly",
          label: "What monthly payment feels comfortable?",
          required: false,
          choices: ["Under $800", "$800 – $1,200", "$1,200 – $1,600", "Over $1,600", "Not sure"],
        },
      ],
    },
    {
      key: "credit",
      title: "Your credit",
      lede: "Your best guess is fine. This is not a credit check and won't touch your score.",
      questions: [
        {
          name: "credit",
          label: "How would you describe your credit?",
          required: true,
          choices: ["Excellent (720+)", "Good (660 – 719)", "Fair (600 – 659)", "Needs work (under 600)", "Not sure"],
        },
        {
          name: "history",
          label: "Any bankruptcy, foreclosure or repossession in the last few years?",
          required: false,
          choices: ["None", "Bankruptcy", "Foreclosure", "Repossession", "Prefer to discuss"],
        },
        {
          name: "preapproved",
          label: "Have you already been pre-approved anywhere?",
          required: false,
          choices: ["Yes", "No", "Working on it"],
        },
        BEST_TIME,
        NOTES,
      ],
    },
  ],
};

export const FORMS: Record<FormKind, LeadForm> = { quote: QUOTE, financing: FINANCING };

/** Contact details are step 1, typed rather than tapped. */
export const totalSteps = (f: LeadForm) => f.steps.length + 1;

export const allQuestions = (f: LeadForm) => f.steps.flatMap((s) => s.questions);

export const visible = (q: Question, a: Record<string, string>) => !q.showIf || q.showIf(a);

/** Split a multi-select answer back into its picks. */
export const picks = (v: string | undefined) => (v ? v.split(", ").filter(Boolean) : []);
