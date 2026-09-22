// Replora AI — Brand Logo Component

interface ReploraLogoProps {
  size?: number;          // icon size in px
  showWordmark?: boolean; // show "Replora AI" text beside icon
  collapsed?: boolean;    // sidebar collapsed mode
}

export function ReploraIcon({ size = 36 }: { size?: number }) {
  const id = `rg-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B5CFF" />
          <stop offset="0.55" stopColor="#5B7CF7" />
          <stop offset="1" stopColor="#00CFFF" />
        </linearGradient>
        <linearGradient id={`${id}-glow`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#00CFFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#7B5CFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="36" height="36" rx="9" fill={`url(#${id}-bg)`} />

      {/* Subtle inner glow */}
      <rect width="36" height="36" rx="9" fill={`url(#${id}-glow)`} opacity="0.25" />

      {/* Chat bubble body */}
      <path
        d="M7 9.5C7 7.843 8.343 6.5 10 6.5H26C27.657 6.5 29 7.843 29 9.5V19.5C29 21.157 27.657 22.5 26 22.5H20.8L17.5 27.2L14.2 22.5H10C8.343 22.5 7 21.157 7 19.5V9.5Z"
        fill="white"
        fillOpacity="0.18"
      />
      {/* Bubble border shine */}
      <path
        d="M7 9.5C7 7.843 8.343 6.5 10 6.5H26C27.657 6.5 29 7.843 29 9.5V19.5C29 21.157 27.657 22.5 26 22.5H20.8L17.5 27.2L14.2 22.5H10C8.343 22.5 7 21.157 7 19.5V9.5Z"
        stroke="white"
        strokeOpacity="0.25"
        strokeWidth="0.8"
        fill="none"
      />

      {/* 4-point sparkle star — centered in bubble */}
      <path
        d="M17.5 8.5L18.9 13.1L23.5 14.5L18.9 15.9L17.5 20.5L16.1 15.9L11.5 14.5L16.1 13.1Z"
        fill="white"
      />

      {/* Orbit dot — top right outside bubble */}
      <circle cx="27.5" cy="4.5" r="1.8" fill="white" fillOpacity="0.85" />
      <circle cx="27.5" cy="4.5" r="1" fill="#00CFFF" />

      {/* Small accent dots */}
      <circle cx="30.5" cy="27" r="1.1" fill="white" fillOpacity="0.45" />
      <circle cx="5.5"  cy="28" r="0.9" fill="white" fillOpacity="0.35" />
    </svg>
  );
}

export function ReploraLogo({ size = 36, showWordmark = true, collapsed = false }: ReploraLogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <ReploraIcon size={size} />
      {showWordmark && !collapsed && (
        <div className="flex flex-col leading-none">
          <span
            className="font-black text-[14px] tracking-tight"
            style={{
              background: "linear-gradient(90deg,#FFFFFF,#C4B5FD)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Replora
          </span>
          <span
            className="text-[10px] font-bold tracking-widest uppercase mt-0.5"
            style={{
              background: "linear-gradient(90deg,#7B5CFF,#00CFFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI
          </span>
        </div>
      )}
    </div>
  );
}
