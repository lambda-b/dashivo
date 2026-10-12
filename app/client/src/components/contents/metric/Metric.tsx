import clsx from "clsx";
import type { DataRow, MetricContentDefinition } from "@shared/dashboard";

interface MetricProps {
  definition: MetricContentDefinition;
  data: DataRow[];
}

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

const MetricCard = ({ definition, value }: MetricCardProps) => (
  <article
    className={clsx(
      "flex min-w-0 flex-col gap-2 rounded-xl border p-5 shadow-sm",
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
    <strong className="break-words text-3xl tracking-tight">
      {definition.format === "currency" ? currency.format(value) : number.format(value)}
    </strong>
  </article>
);

export const Metric = ({ definition, data }: MetricProps) => (
  <section
    aria-label={definition.title}
    className={definition.columns === 2 ? "grid grid-cols-2 gap-5" : "grid grid-cols-1 gap-5"}
  >
    {data.map((row, index) => (
      <MetricCard
        definition={{ ...definition, title: (row.label as string) || definition.title }}
        value={row.value as number}
        key={index}
      />
    ))}
  </section>
);
