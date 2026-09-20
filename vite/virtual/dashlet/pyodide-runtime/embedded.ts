import createPyodideModule from "pyodide/pyodide.asm.mjs";
import { loadPyodide, type PyodideAPI } from "pyodide";
import lockFileContents from "pyodide/pyodide-lock.json";
import { compressedPyodideWasm, compressedPythonAssets } from "#generated/assets";

type LoadPyodideOptions = NonNullable<Parameters<typeof loadPyodide>[0]>;
type CreatePyodideModule = NonNullable<LoadPyodideOptions["createPyodideModule"]>;

const embeddedAssetUrl = "https://dashlet.invalid/pyodide/";
const nativeFetch = globalThis.fetch.bind(globalThis);
const embeddedPyodideModule: CreatePyodideModule = (settings) =>
  createPyodideModule(settings) as ReturnType<CreatePyodideModule>;

const createCompressedResponse = async (encoded: string, contentType: string) => {
  const response = await nativeFetch(`data:application/gzip;base64,${encoded}`);

  return new Response(response.body!.pipeThrough(new DecompressionStream("gzip")), {
    headers: { "Content-Type": contentType },
  });
};

const embeddedResponses: Readonly<Record<string, () => Promise<Response>>> = {
  "pyodide.asm.wasm": () => createCompressedResponse(compressedPyodideWasm, "application/wasm"),
  ...Object.fromEntries(
    Object.entries(compressedPythonAssets).map(([name, encoded]) => [
      name,
      () => createCompressedResponse(encoded, "application/octet-stream"),
    ]),
  ),
};

const installEmbeddedAssetLoader = () => {
  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (!url.startsWith(embeddedAssetUrl)) return nativeFetch(input, init);

    const name = decodeURIComponent(url.slice(embeddedAssetUrl.length));
    return embeddedResponses[name]();
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
