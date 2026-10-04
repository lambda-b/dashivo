import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ButtonProps {
  ariaLabel?: string;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  icon?: LucideIcon;
  iconOnly?: boolean;
  onClick?: () => void;
  pending?: boolean;
  size?: "default" | "compact" | "regular";
  title?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "edit" | "danger" | "ghost" | "dashed" | "link";
}

const variants = {
  primary: "bg-brand border-transparent text-white hover:bg-brand-dark",
  secondary: "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
  edit: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100",
  danger: "border-red-200 text-red-700 hover:bg-red-50",
  ghost: "border-transparent text-stone-500 hover:bg-stone-100",
  dashed: "border-dashed border-stone-300 text-stone-600 hover:bg-stone-50",
  link: "border-transparent text-indigo-700 hover:underline",
};

export const Button = ({
  ariaLabel,
  children,
  disabled,
  className,
  icon: Icon,
  iconOnly,
  onClick,
  pending,
  size = "default",
  title,
  type = "button",
  variant = "secondary",
}: ButtonProps) => (
  <button
    aria-label={ariaLabel}
    aria-busy={pending || undefined}
    className={twMerge(
      clsx(
        "focus-visible:ring-brand/40 inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md border font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        variant === "link" ? "justify-start break-all p-0 text-left text-xs" : "justify-center",
        iconOnly
          ? "aspect-square w-fit shrink-0 p-2"
          : variant !== "link" &&
              (size === "compact"
                ? "px-2 py-1 text-xs"
                : size === "regular"
                  ? "px-3 py-2 text-sm"
                  : "px-3 py-2 text-xs"),
      ),
      className,
    )}
    disabled={disabled || pending}
    onClick={onClick}
    title={title}
    type={type}
  >
    {pending ? (
      <LoaderCircle aria-hidden="true" className="size-3.5 shrink-0 animate-spin" />
    ) : Icon ? (
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
    ) : null}
    {children}
  </button>
);
