// Símbolo de Nuna: el pez (ichthys).
export function Fish({ size = 28, strokeWidth = 2, className = "" }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 12C7 5 14 5 22 17" />
      <path d="M2 12C7 19 14 19 22 7" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <Fish className="text-lime" />
      <span className="font-display text-xl font-bold tracking-tight">Orbusiness</span>
    </span>
  );
}
