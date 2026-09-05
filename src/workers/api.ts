export interface PythonWorkerApi {
  execute(params: Record<string, unknown>): Promise<unknown>;
}
