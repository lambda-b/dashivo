import { z } from "zod";

const pythonSourceSchema = z.object({ source: z.string() });

const readError = (result: unknown, fallback: string) =>
  typeof result === "object" && result !== null && "error" in result
    ? String(result.error)
    : fallback;

export const loadPythonSource = async (path: string) => {
  const response = await fetch(`/__dashlet/python-source?path=${encodeURIComponent(path)}`);
  const result: unknown = await response.json();
  if (!response.ok) throw new Error(readError(result, "Pythonファイルを読み込めませんでした。"));
  return pythonSourceSchema.parse(result).source;
};

export const savePythonSource = async (path: string, source: string) => {
  const response = await fetch(`/__dashlet/python-source?path=${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "text/x-python; charset=utf-8" },
    body: source,
  });
  if (response.ok) return;
  const result: unknown = await response.json();
  throw new Error(readError(result, "Pythonファイルを保存できませんでした。"));
};

export const createPythonSource = async (path: string, source: string) => {
  const response = await fetch(`/__dashlet/python-source?path=${encodeURIComponent(path)}`, {
    method: "POST",
    headers: { "Content-Type": "text/x-python; charset=utf-8" },
    body: source,
  });
  if (response.ok) return;
  const result: unknown = await response.json();
  throw new Error(readError(result, "Pythonファイルを作成できませんでした。"));
};
