import React from "react";

export interface PageHeadingProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: PageHeadingProps) {
  return (
    <div className="page-heading flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7" data-section={eyebrow}>
      <div>
        <span className="eyebrow text-muted text-[8px] font-bold tracking-[1.65px] uppercase">{eyebrow}</span>
        <h1 className="my-[6px] text-ink font-heading font-bold text-[clamp(25px,3vw,35px)] leading-[1.15] tracking-[-1.4px]">{title}</h1>
        {subtitle?.trim() && <p className="m-0 text-muted text-[11px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

