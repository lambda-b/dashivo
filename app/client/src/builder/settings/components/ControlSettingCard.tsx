import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/primitives/IconButton";

interface ControlSettingCardProps {
  children: ReactNode;
  controlDisplayName: string;
  typeLabel: string;
  onRemove: () => void;
}

export const ControlSettingCard = ({
  children,
  controlDisplayName,
  typeLabel,
  onRemove,
}: ControlSettingCardProps) => (
  <fieldset className="rounded-lg border border-stone-200 p-4">
    <div className="mb-4 flex items-center justify-between gap-4">
      <legend className="text-xs font-bold tracking-wide text-stone-500">{typeLabel}</legend>
      <IconButton
        icon={Trash2}
        label={`${controlDisplayName}を削除`}
        onClick={onRemove}
        variant="danger"
      />
    </div>
    {children}
  </fieldset>
);
