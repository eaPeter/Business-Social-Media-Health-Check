const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const ArrowRight = () => (
  <svg {...base} width={18} height={18}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ChevronLeft = () => (
  <svg {...base} width={16} height={16}><path d="m15 6-6 6 6 6" /></svg>
);
export const Check = () => (
  <svg {...base} width={16} height={16} strokeWidth={2.5}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const Compass = () => (
  <svg {...base} width={16} height={16}><circle cx="12" cy="12" r="1.5" /><path d="M12 4v3M12 17v3M4 12h3M17 12h3" /></svg>
);
