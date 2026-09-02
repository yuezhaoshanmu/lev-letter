type ButterflyProps = {
  className?: string;
  variant?: "blue" | "green" | "moon";
  label?: string;
};

export default function Butterfly({ className = "", variant = "blue", label = "" }: ButterflyProps) {
  return (
    <svg
      className={`butterfly butterfly-${variant} ${className}`}
      viewBox="0 0 76 56"
      role={label ? "img" : "presentation"}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path className="wing wing-left" d="M37.7 27.9C25 7.5 6.6 8.3 8.1 17.1c1.3 7.8 12.7 13.3 27.4 14.9" />
        <path className="wing wing-right" d="M38.3 27.9C51 7.5 69.4 8.3 67.9 17.1c-1.3 7.8-12.7 13.3-27.4 14.9" />
        <path className="wing wing-left lower" d="M37.1 30.5C26.2 23.5 12 26.4 14.4 34.1c1.8 5.8 12.6 6.5 23 1.8" />
        <path className="wing wing-right lower" d="M38.9 30.5C49.8 23.5 64 26.4 61.6 34.1c-1.8 5.8-12.6 6.5-23 1.8" />
        <path d="M38 24.6c-1.8 4.1-1.8 8.6 0 13" />
        <path d="M37.7 24c-2.1-4.2-4-6.3-6-7.4M38.3 24c2.1-4.2 4-6.3 6-7.4" opacity=".7" />
      </g>
      <ellipse cx="38" cy="30" rx="1.5" ry="6.6" fill="currentColor" opacity=".9" />
    </svg>
  );
}
