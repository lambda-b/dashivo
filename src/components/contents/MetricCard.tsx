import clsx from "clsx";
import type { MetricContentDefinition } from "@/schema/dashboard";

interface MetricCardProps {
  definition: MetricContentDefinition;
  value: number;
}

const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("ja-JP");

export const MetricCard = ({ definition, value }: MetricCardProps) => (
  <article
    className={clsx(
      "flex flex-col gap-2 rounded-xl border p-5 shadow-sm",
      definition.emphasis === "strong"
        ? "border-stone-800 bg-stone-800 text-white"
        : "border-brand/20 bg-brand-soft",
    )}
  >
    <span
      className={clsx(
        "text-xs font-medium uppercase tracking-wide",
        definition.emphasis === "strong" ? "opacity-55" : "text-brand-dark/60",
      )}
    >
      {definition.title}
    </span>
    <strong className="text-3xl tracking-tight">
      {definition.format === "currency" ? currency.format(value) : number.format(value)}
    </strong>
  </article>
);
