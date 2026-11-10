import React from "react";

export interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeading({
  title,
  action,
}: PageHeadingProps) {
  return (
    <div className="page-heading flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="my-0 text-ink font-heading font-bold text-[clamp(24px,3vw,32px)] leading-[1.15] tracking-[-1px]">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
