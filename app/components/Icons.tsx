import Image from "next/image";
import logo from "../../public/WFHC-WAYCROSS-logo.png";

type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const HouseIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M10 20v-5.5h4V20" />
  </svg>
);

export const KeyIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8-8M16 7l2.5 2.5M14 9l2 2" />
  </svg>
);

export const ShieldIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const TreeIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M12 3 6.5 11h3L6 16h12l-3.5-5h3z" />
    <path d="M12 16v5" />
  </svg>
);

export const ArrowRight = ({ className }: P) => (
  <svg {...base} strokeWidth={2} className={className} aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Check = ({ className }: P) => (
  <svg {...base} strokeWidth={2} className={className} aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const Cross = ({ className }: P) => (
  <svg {...base} strokeWidth={2} className={className} aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const PhoneIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 5.5 1.5 1.5 0 0 1 5 4z" />
  </svg>
);

export const PinIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);

export const SendIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" />
  </svg>
);

export const ChevronDown = ({ className }: P) => (
  <svg {...base} strokeWidth={2} className={className} aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const BedIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" />
    <circle cx="7" cy="11" r="1.6" />
  </svg>
);

export const BathIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 3.5-1.3M7 19l-1 2M17 19l1 2" />
  </svg>
);

export const RulerIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M3 16.5 16.5 3 21 7.5 7.5 21zM7 12.5l1.5 1.5M10 9.5l1.5 1.5M13 6.5l1.5 1.5" />
  </svg>
);

export const RollerIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <rect x="4" y="3" width="14" height="5" rx="1" />
    <path d="M18 5.5h2v5h-8v3M11 13.5h2V21h-2z" />
  </svg>
);

export const ClockIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const StarIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  </svg>
);

export const QuoteIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M4 18v-5.5C4 8.4 6.2 6 10 5.5V8c-2 .5-3 1.8-3 4h3v6zm10 0v-5.5c0-4.1 2.2-6.5 6-7V8c-2 .5-3 1.8-3 4h3v6z" />
  </svg>
);

export const MenuIcon = ({ className }: P) => (
  <svg {...base} strokeWidth={2} className={className} aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CalendarIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

export const TruckIcon = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" />
    <circle cx="6.5" cy="17.5" r="1.7" />
    <circle cx="16.5" cy="17.5" r="1.7" />
  </svg>
);

/**
 * Brand logo; size it with a height class, width follows the artwork.
 * The source PNG is 1280×720 with the artwork occupying (106, 44) → (1197, 510),
 * so we frame just that region instead of showing the transparent canvas around it.
 */
export function Logo({ className = "h-10" }: P) {
  return (
    <span className={`relative inline-block aspect-[1091/466] shrink-0 overflow-hidden align-middle ${className}`}>
      <Image
        src={logo}
        alt="Wayne Frier Home Center of Waycross"
        sizes="320px"
        className="absolute top-[-9.44%] left-[-9.72%] h-auto w-[117.32%] max-w-none"
      />
    </span>
  );
}
