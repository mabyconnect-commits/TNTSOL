export default function BrandMark({ className = "mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 110" aria-hidden="true">
      <path d="M40 28 C 40 14, 60 14, 68 4" fill="none" stroke="#FFB627" strokeWidth="3" strokeLinecap="round" />
      <circle cx="68" cy="4" r="4" fill="#FFB627" />
      <rect x="11" y="25" width="58" height="9" rx="2" fill="#0A0908" />
      <rect x="11" y="33" width="58" height="68" rx="5" fill="#FF2D1F" />
      <text x="40" y="74" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="15" fill="#FFF6E8" letterSpacing="0.05em">TNT</text>
    </svg>
  );
}
