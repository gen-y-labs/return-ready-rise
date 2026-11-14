export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Return Ready Rise" className={className}>
      <path d="M 54 32 A 22 22 0 1 1 47.56 16.44" fill="none" stroke="#0E7069" strokeWidth="6" strokeLinecap="round" />
      <path d="M51.1 11.5 L52.6 21.7 L42.6 20 Z" fill="#0E7069" stroke="#0E7069" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M23.5 32.5 L29.5 38.5 L40.5 26.5" fill="none" stroke="#A3166F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
