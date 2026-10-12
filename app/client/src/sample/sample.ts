import definition from "@/sample/dashboard.json";

const files = import.meta.glob<string>("./{data,logic}/**/*.{csv,py}", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const sample = {
  ...definition,
  sources: Object.fromEntries(
    Object.entries(files).map(([path, source]) => [path.slice(2), source]),
  ),
};
