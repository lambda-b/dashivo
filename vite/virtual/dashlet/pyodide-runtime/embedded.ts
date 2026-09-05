import createPyodideModule from "pyodide/pyodide.asm.mjs";
import { loadPyodide, type PyodideAPI } from "pyodide";
import lockFileContents from "pyodide/pyodide-lock.json";
import { embeddedAssets } from "#generated/assets";

type LoadPyodideOptions = NonNullable<Parameters<typeof loadPyodide>[0]>;
type CreatePyodideModule = NonNullable<LoadPyodideOptions["createPyodideModule"]>;

const embeddedAssetUrl = "https://dashlet.invalid/pyodide/";
const nativeFetch = globalThis.fetch.bind(globalThis);
const embeddedPyodideModule: CreatePyodideModule = (settings) =>
  createPyodideModule(settings) as ReturnType<CreatePyodideModule>;

const toDataUrl = (name: string, encoded: string) =>
  `data:${name.endsWith(".wasm") ? "application/wasm" : "application/octet-stream"};base64,${encoded}`;

const installEmbeddedAssetLoader = () => {
  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (!url.startsWith(embeddedAssetUrl)) return nativeFetch(input, init);

    const name = decodeURIComponent(url.slice(embeddedAssetUrl.length));
    const encoded = embeddedAssets[name];
    if (!encoded) return new Response("Embedded asset not found", { status: 404 });

    return nativeFetch(toDataUrl(name, encoded));
  };
};

export const initializePyodide = (): Promise<PyodideAPI> => {
  installEmbeddedAssetLoader();
  return loadPyodide({
    createPyodideModule: embeddedPyodideModule,
    indexURL: embeddedAssetUrl,
    packageBaseUrl: embeddedAssetUrl,
    lockFileContents: JSON.stringify(lockFileContents),
  });
};
