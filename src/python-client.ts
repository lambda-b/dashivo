import PythonWorker from "./python.worker?worker&inline";

interface WorkerResponse<T> {
  id?: number;
  type?: "progress";
  stage?: string;
  result?: T;
  error?: string;
}

let nextId = 0;
const worker = new PythonWorker();
const pending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (reason: Error) => void }
>();

worker.onmessage = (event: MessageEvent<WorkerResponse<unknown>>) => {
  if (event.data.type === "progress") {
    console.debug(`[Dashlet Worker] ${event.data.stage}`);
    return;
  }
  if (event.data.id === undefined) return;
  const request = pending.get(event.data.id);
  if (!request) return;
  pending.delete(event.data.id);
  if (event.data.error) request.reject(new Error(event.data.error));
  else request.resolve(event.data.result);
};

worker.onerror = (event) => {
  const error = new Error(event.message || "Python Worker failed to start.");
  for (const request of pending.values()) request.reject(error);
  pending.clear();
};

export function executePython<T>(params: Record<string, unknown>): Promise<T> {
  const id = (nextId += 1);

  return new Promise((resolve, reject) => {
    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
    });
    worker.postMessage({ id, params });
  });
}
