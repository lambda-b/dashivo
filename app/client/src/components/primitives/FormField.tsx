import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const FormField = ({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={twMerge("grid min-w-0 gap-1 text-xs font-medium text-stone-600", className)}>
    <span>{label}</span>
    {children}
  </label>
);
