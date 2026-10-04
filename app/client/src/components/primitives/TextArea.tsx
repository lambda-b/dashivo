import { fieldClassName } from "@/components/primitives/field-styles";
import { twMerge } from "tailwind-merge";

export const TextArea = ({
  className,
  onChange,
  value,
}: {
  className?: string;
  onChange: (value: string) => void;
  value: string;
}) => (
  <textarea
    className={twMerge(fieldClassName, "min-h-20 resize-y", className)}
    onChange={(event) => onChange(event.target.value)}
    value={value}
  />
);
