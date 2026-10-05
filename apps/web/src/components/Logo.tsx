/** Logo em texto enquanto não temos o arquivo original do logo. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex flex-col items-center leading-none ${className}`}>
      <span className="font-serif text-2xl font-semibold tracking-[0.3em] sm:text-3xl">EMPÓRIO</span>
      <span className="-mt-1 font-script text-2xl sm:text-3xl">Gigi Prado</span>
    </span>
  );
}
