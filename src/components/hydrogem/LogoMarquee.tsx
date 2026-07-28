import academyx from "/academyx.png";
import azoob from "/azoob.png";
import lara from "/lara.png";
import ghala from "/ghala.png";
import hydrogem from "/hydrogem.png";

const LOGOS = [
  { src: hydrogem, alt: "HydroGem" },
  { src: lara, alt: "Lara" },
  { src: ghala, alt: "Ghala" },
  { src: azoob, alt: "Azoob" },
  { src: academyx, alt: "Academy X" },
];

function Heart() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0 text-[var(--blush)]"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 21s-8-5-8-11a5 5 0 019-3 5 5 0 019 3c0 6-8 11-8 11z" />
    </svg>
  );
}

export function LogoMarquee() {
  const row = [...LOGOS, ...LOGOS];
  return (
    <div className="relative overflow-hidden py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-8">
        {row.map((l, i) => (
          <div key={`${l.alt}-${i}`} className="flex items-center gap-8">
            <img
              src={l.src}
              alt={l.alt}
              loading="lazy"
              decoding="async"
              className="h-8 w-auto object-contain opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 sm:h-10"
            />
            <Heart />
          </div>
        ))}
      </div>
    </div>
  );
}
