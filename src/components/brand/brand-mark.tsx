import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="AI Call Closer logo"
      className={cn("h-8 w-8", className)}
    >
      <defs>
        <linearGradient id="brand-bg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3D7BFF" />
          <stop offset="1" stopColor="#8D4BFF" />
        </linearGradient>
        <linearGradient id="brand-ring" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7D27E" />
          <stop offset="1" stopColor="#B88C1E" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="18" fill="#0B0F19" />
      <rect x="6" y="6" width="52" height="52" rx="15" fill="url(#brand-bg)" />
      <rect x="6" y="6" width="52" height="52" rx="15" fill="none" stroke="url(#brand-ring)" strokeOpacity="0.55" />

      <path
        d="M21 20.9h3.1c.6 0 1.1.4 1.2 1l.4 2.4c.1.5-.2 1.1-.7 1.3l-1.3.7c1 2 2.6 3.6 4.6 4.6l.7-1.3c.2-.5.8-.8 1.3-.7l2.4.4c.6.1 1 .6 1 1.2V34c0 .7-.6 1.3-1.3 1.3H31A10 10 0 0 1 21 25.3V22.2c0-.7.6-1.3 1.3-1.3Z"
        fill="white"
      />

      <path d="M36 22.5h8.5" stroke="#F5F2EA" strokeWidth="2" strokeLinecap="round" />
      <path d="m42 18 2.5 4.5L42 27" stroke="#F5F2EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M27.5 44.5h10.8" stroke="#EAD691" strokeWidth="2.3" strokeLinecap="round" />
      <path d="m35 39.5 3.3 5-3.3 5" stroke="#EAD691" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="45.5" cy="17.5" r="2.2" fill="#EAD691" />
    </svg>
  );
}
