import { Button } from "@/components/primitives/Button";
import { Pencil } from "lucide-react";
import type { ReactNode } from "react";

interface EditButtonProps {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  onClick: () => void;
  size?: "default" | "compact";
}

export const EditButton = ({
  ariaLabel,
  children,
  className,
  onClick,
  size = "default",
}: EditButtonProps) => (
  <Button
    ariaLabel={ariaLabel}
    className={className}
    icon={Pencil}
    onClick={onClick}
    size={size}
    variant="edit"
  >
    {children}
  </Button>
);
