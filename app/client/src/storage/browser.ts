import { createStore, get, update } from "idb-keyval";
import {
  dashboardSchema,
  dashboardDefinitionChangeSchema,
  inputSourcePathSchema,
  pythonSourcePathSchema,
  pythonLogicCreateSchema,
  type DashboardSchema,
} from "@shared/dashboard";
import { inputSourceUploadQuerySchema } from "@shared/api";
import { ApiError } from "@/api/request";
import { messages } from "@/messages";
import type { DashboardStorage } from "@/storage/server";
import { sample } from "@/sample/sample";
import { registerDashboard } from "@/api/dashboards";

interface StoredDashboard {
  id: string;
  dashboard: DashboardSchema;
  sources: Record<string, string>;
  updatedAt: string;
  revisionId: string;
  registrations: Record<string, string>;
}

const store = createStore("dashivo-guest", "dashboards");

const requireDashboard = (record: StoredDashboard | undefined) => {
  if (!record) throw new ApiError(messages.storage.notFound, 404);
  return record;
};

const read = async (id: string) => requireDashboard(await get<StoredDashboard>(id, store));

export const loadTrial = () => get<StoredDashboard>("trial", store);

const initializeSample = async () => {
  await update<StoredDashboard | undefined>(
    "trial",
    (record) =>
      record ?? {
        id: "trial",
        dashboard: dashboardSchema.parse(sample.dashboard),
        sources: sample.sources,
        updatedAt: new Date().toISOString(),
        revisionId: sample.revisionId,
        registrations: {},
      },
    store,
  );
  return read("trial");
};

export const registerTrial = async (ownerId: string) => {
  const trial = await loadTrial();
  if (!trial || trial.revisionId === sample.revisionId) return undefined;
  const key = `${ownerId}:${trial.revisionId}`;
  if (trial.registrations[key]) return undefined;
  const paths = new Set(
    [...trial.dashboard.analysis.inputs, ...trial.dashboard.analysis.logic].map(
      (item) => item.path,
    ),
  );
  const registered = await registerDashboard({
    revisionId: trial.revisionId,
    dashboard: trial.dashboard,
    sources: Object.fromEntries([...paths].map((path) => [path, trial.sources[path]])),
  });
  await update<StoredDashboard>(
    trial.id,
    (current) => {
      const record = requireDashboard(current);
      return { ...record, registrations: { ...record.registrations, [key]: registered.id } };
    },
    store,
  );
  return registered;
};

// 定義とソースを同じレコードに保存し、IndexedDBのトランザクションで一緒に更新する。
const write = async (id: string, change: (record: StoredDashboard) => StoredDashboard) => {
  await update<StoredDashboard | undefined>(
    id,
    (current) => {
      const previous = requireDashboard(current);
      const next = change(previous);
      if (
        JSON.stringify([previous.dashboard, previous.sources]) ===
        JSON.stringify([next.dashboard, next.sources])
      )
        return previous;
      return { ...next, revisionId: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    },
    store,
  );

  return dashboardSchema.parse((await read(id)).dashboard);
};

const readSource = async (id: string, path: string) => {
  const record = await read(id);
  if (!Object.hasOwn(record.sources, path)) throw new ApiError(messages.storage.notFound, 404);
  return record.sources[path];
};

export const browserStorage: DashboardStorage = {
  loadDashboards: async () => {
    const { id, dashboard, updatedAt, revisionId } =
      (await loadTrial()) ?? (await initializeSample());
    return [{ id, title: dashboard.title, updatedAt, sample: revisionId === sample.revisionId }];
  },

  createDashboard: async () => {
    throw new ApiError(messages.auth.creationRequiresLogin, 403);
  },

  loadDashboard: async (id) => dashboardSchema.parse((await read(id)).dashboard),

  saveDashboard: async (id, change) => {
    const valid = dashboardDefinitionChangeSchema.parse(change);
    return write(id, (record) => ({
      ...record,
      dashboard: dashboardSchema.parse(
        "settings" in valid
          ? { ...valid.settings, analysis: record.dashboard.analysis }
          : { ...record.dashboard, analysis: valid.analysis },
      ),
    }));
  },

  loadAssetCatalog: async (id) => {
    const paths = Object.keys((await read(id)).sources).toSorted();
    return {
      csv: paths.filter((path) => path.startsWith("data/")),
      python: paths.filter((path) => path.startsWith("logic/")),
    };
  },

  loadInputSource: (id, path) => readSource(id, inputSourcePathSchema.parse(path)),
  loadPythonSource: (id, path) => readSource(id, pythonSourcePathSchema.parse(path)),

  uploadInputSource: async (id, file) => {
    const { fileName } = inputSourceUploadQuerySchema.parse({ fileName: file.name });
    const path = inputSourcePathSchema.parse(`data/${fileName}`);
    const source = await file.text();
    await write(id, (record) => {
      if (Object.hasOwn(record.sources, path)) throw new ApiError(messages.storage.fileExists, 409);
      return { ...record, sources: { ...record.sources, [path]: source } };
    });

    return path;
  },

  savePythonSource: async (id, path, source) => {
    const validPath = pythonSourcePathSchema.parse(path);
    await write(id, (record) => ({
      ...record,
      sources: { ...record.sources, [validPath]: source },
    }));
  },

  createPythonLogic: async (id, definition) => {
    const logic = pythonLogicCreateSchema.parse(definition);
    return write(id, (record) => {
      if (Object.hasOwn(record.sources, logic.path))
        throw new ApiError(messages.storage.fileExists, 409);

      return {
        ...record,
        sources: { ...record.sources, [logic.path]: logic.source },
        dashboard: dashboardSchema.parse({
          ...record.dashboard,
          analysis: {
            ...record.dashboard.analysis,
            logic: [...record.dashboard.analysis.logic, { ...logic, type: "python" }],
          },
        }),
      };
    });
  },

  downloadDashboardFile: async () => {
    throw new ApiError(messages.auth.downloadRequiresLogin, 401);
  },
};
