import createPyodideModule from "pyodide/pyodide.asm.mjs";
import { loadPyodide, type PyodideAPI } from "pyodide";
import lockFileContents from "pyodide/pyodide-lock.json";
import { compressedPyodideWasm, compressedPythonAssets } from "#generated/assets";

type LoadPyodideOptions = NonNullable<Parameters<typeof loadPyodide>[0]>;
type CreatePyodideModule = NonNullable<LoadPyodideOptions["createPyodideModule"]>;

const embeddedAssetUrl = "https://dashivo.invalid/pyodide/";
const nativeFetch = globalThis.fetch.bind(globalThis);
const embeddedPyodideModule: CreatePyodideModule = (settings) =>
  createPyodideModule(settings) as ReturnType<CreatePyodideModule>;

const createCompressedResponse = (encoded: string, contentType: string) =>
  nativeFetch(`data:application/gzip;base64,${encoded}`).then(
    (res) =>
      new Response(res.body!.pipeThrough(new DecompressionStream("gzip")), {
        headers: { "Content-Type": contentType },
      }),
  );

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
  globalThis.fetch = (input) =>
    embeddedResponses[decodeURIComponent(new Request(input).url.slice(embeddedAssetUrl.length))]();
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
