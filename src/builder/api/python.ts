import { z } from "zod";

export const loadPythonSource = async (path: string) => {
  const response = await fetch(`/__dashlet/python-source?path=${encodeURIComponent(path)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Pythonを読み込めませんでした。");
  return z.object({ source: z.string() }).parse(result).source;
};

export const savePythonSource = async (path: string, source: string) => {
  const response = await fetch(`/__dashlet/python-source?path=${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "text/x-python; charset=utf-8" },
    body: source,
  });
  if (!response.ok)
    throw new Error((await response.json()).error ?? "Pythonを保存できませんでした。");
};

export const loadAssetCatalog = async () => {
  const response = await fetch("/__dashlet/assets");
  if (!response.ok) throw new Error("ファイル一覧を取得できませんでした。");
  return z
    .object({ csv: z.array(z.string()), python: z.array(z.string()) })
    .parse(await response.json());
};
