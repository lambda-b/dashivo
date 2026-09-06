import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { EditorIconButton } from "@/builder/components/EditorIconButton";

interface ControlEditorCardProps {
  children: ReactNode;
  controlDisplayName: string;
  typeLabel: string;
  onRemove: () => void;
}

export const ControlEditorCard = ({
  children,
  controlDisplayName,
  typeLabel,
  onRemove,
}: ControlEditorCardProps) => (
  <fieldset className="rounded-lg border border-stone-200 p-4">
    <div className="mb-4 flex items-center justify-between gap-4">
      <legend className="text-xs font-bold tracking-wide text-stone-500">{typeLabel}</legend>
      <EditorIconButton
        icon={Trash2}
        label={`${controlDisplayName}を削除`}
        onClick={onRemove}
        variant="danger"
      />
    </div>
    {children}
  </fieldset>
);
