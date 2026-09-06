import * as SliderPrimitive from "@radix-ui/react-slider";

interface SliderProps {
  ariaLabel: string;
  max: number;
  min: number;
  name: string;
  onChange: (value: number[]) => void;
  step: number;
  value: number[];
}

export const Slider = ({ ariaLabel, max, min, name, onChange, step, value }: SliderProps) => (
  <SliderPrimitive.Root
    className="relative flex h-5 w-full touch-none select-none items-center"
    max={max}
    min={min}
    name={name}
    onValueChange={onChange}
    step={step}
    value={value}
  >
    <SliderPrimitive.Track className="relative h-2 grow overflow-hidden rounded-full bg-stone-200">
      <SliderPrimitive.Range className="bg-brand absolute h-full" />
    </SliderPrimitive.Track>
    {value.map((_, index) => (
      <SliderPrimitive.Thumb
        aria-label={value.length === 1 ? ariaLabel : `${ariaLabel} ${index + 1}`}
        className="border-brand focus:ring-brand/30 block size-5 cursor-grab rounded-full border-2 bg-white shadow-sm outline-none focus:ring-4 active:cursor-grabbing"
        key={index}
      />
    ))}
  </SliderPrimitive.Root>
);
