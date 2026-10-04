import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "@/components/primitives/IconButton";

interface DialogProps {
  className?: string;
  children: ReactNode;
  closeLabel?: string;
  description?: ReactNode;
  dismissDisabled?: boolean;
  eyebrow?: string;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  size?: "small" | "medium" | "large";
  title: string;
}

export const Dialog = ({
  className,
  children,
  closeLabel,
  description,
  dismissDisabled,
  eyebrow,
  footer,
  onClose,
  open,
  size = "medium",
  title,
}: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={twMerge(
        clsx(
          "m-auto max-h-[90vh] w-[calc(100%-2rem)] rounded-xl border border-stone-200 bg-white p-0 text-stone-800 shadow-2xl backdrop:bg-stone-950/45",
          size === "small" ? "max-w-md" : size === "large" ? "max-w-3xl" : "max-w-[44rem]",
        ),
        className,
      )}
      onCancel={(event) => {
        if (dismissDisabled) event.preventDefault();
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <header className="flex items-start justify-between gap-6 border-b border-stone-200 px-6 py-5">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-brand mb-1 text-[0.6875rem] font-bold tracking-[0.16em]">
              {eyebrow}
            </p>
          )}
          <h2 className="text-xl font-bold" id={titleId}>
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs leading-5 text-stone-500" id={descriptionId}>
              {description}
            </p>
          )}
        </div>
        <IconButton
          disabled={dismissDisabled}
          icon={X}
          label={closeLabel ?? `${title}を閉じる`}
          onClick={onClose}
        />
      </header>
      <div className="max-h-[60vh] overflow-y-auto p-6">{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-stone-200 px-6 py-4">
          {footer}
        </footer>
      )}
    </dialog>
  );
};
