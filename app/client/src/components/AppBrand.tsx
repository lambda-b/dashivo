import { twMerge } from "tailwind-merge";
import icon from "/favicon.svg?inline";

export const AppBrand = ({ caption, className }: { caption?: string; className?: string }) => (
  <div className={twMerge("flex items-center gap-2", className)}>
    <img alt="" className="size-7 shrink-0" height={28} src={icon} width={28} />
    <p className="text-brand text-[0.6875rem] font-bold tracking-[0.16em]">
      DASHIVO{caption && ` · ${caption}`}
    </p>
  </div>
);
