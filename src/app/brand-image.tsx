type BrandMarkSvgProps = {
  size: number;
};

export function BrandMarkSvg({ size }: BrandMarkSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3D7BFF" />
          <stop offset="1" stopColor="#8D4BFF" />
        </linearGradient>
        <linearGradient id="ring" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7D27E" />
          <stop offset="1" stopColor="#B88C1E" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="18" fill="#0B0F19" />
      <rect x="6" y="6" width="52" height="52" rx="15" fill="url(#bg)" />
      <rect x="6" y="6" width="52" height="52" rx="15" stroke="url(#ring)" strokeOpacity="0.55" />

      <path
        d="M21 20.9h3.1c0.6 0 1.1 0.4 1.2 1l0.4 2.4c0.1 0.5 -0.2 1.1 -0.7 1.3l-1.3 0.7c1 2 2.6 3.6 4.6 4.6l0.7 -1.3c0.2 -0.5 0.8 -0.8 1.3 -0.7l2.4 0.4c0.6 0.1 1 0.6 1 1.2V34c0 0.7 -0.6 1.3 -1.3 1.3H31A10 10 0 0 1 21 25.3V22.2c0 -0.7 0.6 -1.3 1.3 -1.3Z"
        fill="white"
      />
      <path d="M36 22.5h8.5" stroke="#F5F2EA" strokeWidth="2" strokeLinecap="round" />
      <path d="M42 18l2.5 4.5L42 27" stroke="#F5F2EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M27.5 44.5h10.8" stroke="#EAD691" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M35 39.5l3.3 5L35 49.5" stroke="#EAD691" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="45.5" cy="17.5" r="2.2" fill="#EAD691" />
    </svg>
  );
}
