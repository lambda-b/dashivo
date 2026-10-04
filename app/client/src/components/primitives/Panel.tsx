import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface PanelProps {
  className?: string;
  children: ReactNode;
  count?: number;
  footer?: ReactNode;
  icon: LucideIcon;
  title: string;
}

export const Panel = ({ children, className, count, footer, icon: Icon, title }: PanelProps) => (
  <aside
    className={twMerge(
      "min-w-0 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm",
      className,
    )}
  >
    <div className="flex h-12 items-center justify-between border-b border-stone-100 px-4 text-xs font-semibold text-stone-600">
      <div className="flex min-w-0 items-center gap-2">
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span>{title}</span>
      </div>
      {count !== undefined && (
        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[0.625rem] text-stone-500">
          {count}
        </span>
      )}
    </div>
    {children}
    {footer && <div className="border-t border-stone-100 p-3">{footer}</div>}
  </aside>
);
