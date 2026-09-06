import clsx from "clsx";
import { Pencil } from "lucide-react";
import type { ReactNode } from "react";

interface EditButtonProps {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  onClick: () => void;
}

export const EditButton = ({ ariaLabel, children, className, onClick }: EditButtonProps) => (
  <button
    aria-label={ariaLabel}
    className={clsx(
      "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100",
      className,
    )}
    onClick={onClick}
    type="button"
  >
    <Pencil aria-hidden="true" className="size-3.5" />
    {children}
  </button>
);
