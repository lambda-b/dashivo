import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface EditorIconButtonProps {
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

export const EditorIconButton = ({
  disabled,
  icon: Icon,
  label,
  onClick,
  variant = "default",
}: EditorIconButtonProps) => (
  <button
    aria-label={label}
    className={clsx(
      "inline-grid cursor-pointer place-items-center rounded-md border p-2 transition disabled:cursor-not-allowed disabled:opacity-30",
      variant === "danger"
        ? "border-red-200 text-red-700 hover:bg-red-50"
        : "border-transparent text-stone-500 hover:bg-stone-100",
    )}
    disabled={disabled}
    onClick={onClick}
    title={label}
    type="button"
  >
    <Icon aria-hidden="true" className="size-3.5" />
  </button>
);
