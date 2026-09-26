import { Slider } from "@/components/primitives/Slider";
import type { SliderControlDefinition } from "@dashlet/shared/dashboard";

interface SliderControlProps {
  control: SliderControlDefinition;
  onChange: (value: number[]) => void;
  value: number[];
}

export const SliderControl = ({ control, onChange, value }: SliderControlProps) => (
  <fieldset>
    <legend className="text-xs font-semibold text-stone-500">{control.displayName}</legend>
    <output className="mb-2 block text-right font-mono text-xs font-semibold text-stone-700">
      {value.join(" – ")}
    </output>
    <Slider
      ariaLabel={control.displayName}
      max={control.max}
      min={control.min}
      name={control.key}
      onChange={onChange}
      step={control.step}
      value={value}
    />
    <div className="mt-1 flex justify-between font-mono text-[0.625rem] text-stone-400">
      <span>{control.min}</span>
      <span>{control.max}</span>
    </div>
  </fieldset>
);
