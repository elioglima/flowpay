type AgentUserIconProps = {
  color?: string;
};

export function AgentUserIcon({ color }: AgentUserIconProps) {
  const stroke = color ?? "#94a3b8";
  return (
    <svg
      className="agentUserIcon"
      viewBox="0 0 24 24"
      width={22}
      height={22}
      aria-hidden
    >
      <circle cx="12" cy="8.5" r="3.75" fill="none" stroke={stroke} strokeWidth="1.75" />
      <path
        d="M5.5 20.25c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5"
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
