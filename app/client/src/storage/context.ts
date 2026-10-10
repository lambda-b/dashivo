import { createContext, useContext } from "react";
import type { DashboardStorage } from "@/storage/server";

interface Workspace {
  scope: string;
  storage: DashboardStorage;
  authenticated: boolean;
}

export const WorkspaceContext = createContext<Workspace | null>(null);

export const useWorkspace = () => {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("Editor workspace is not available.");

  return {
    ...workspace,
    queryKey: (...key: unknown[]) => ["workspace", workspace.scope, ...key],
  };
};
