export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-symbol inline-flex w-[34px] h-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-transparent ${className}`} aria-hidden="true">
      <img src="/settle-mark.png" alt="Settle Africa" className="block w-full h-full object-contain" />
    </span>
  );
}

