import { Button } from "@/components/primitives/Button";
import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
  className?: string;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

export const IconButton = ({
  className,
  disabled,
  icon,
  label,
  onClick,
  variant = "default",
}: IconButtonProps) => (
  <Button
    ariaLabel={label}
    className={className}
    disabled={disabled}
    icon={icon}
    iconOnly
    onClick={onClick}
    title={label}
    variant={variant === "danger" ? "danger" : "ghost"}
  />
);
