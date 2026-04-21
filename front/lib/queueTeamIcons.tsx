type QueueTeamIconProps = {
  team: string;
  variant?: "inline" | "hero";
};

export function QueueTeamIcon({ team, variant = "inline" }: QueueTeamIconProps) {
  const isHero = variant === "hero";
  const size = isHero ? 56 : 20;
  const stroke = isHero ? 1.45 : 1.75;
  const className = isHero ? "queueTeamIcon queueTeamIconHero" : "queueTeamIcon";
  const shared = {
    className,
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    "aria-hidden": true as const,
  };

  if (team === "cards") {
    return (
      <svg {...shared} fill="none" stroke="currentColor" strokeWidth={stroke}>
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
        <path d="M2 10h20" strokeLinecap="round" />
        <path d="M6 15h4" strokeLinecap="round" />
      </svg>
    );
  }
  if (team === "loans") {
    return (
      <svg
        {...shared}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2" />
        <path d="M3 7h18a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z" />
        <circle cx="17" cy="14" r={isHero ? 1.15 : 1.1} fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg
      {...shared}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="12" r={isHero ? 1.35 : 1.25} fill="currentColor" />
      <circle cx="12" cy="12" r={isHero ? 1.35 : 1.25} fill="currentColor" />
      <circle cx="18" cy="12" r={isHero ? 1.35 : 1.25} fill="currentColor" />
    </svg>
  );
}
