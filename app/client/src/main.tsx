import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { createQueryClient } from "@dashivo/shared-lib/query-client";
import { ApiError } from "@/api/request";
import { ZodError } from "zod";
import { createHashRouter, RouterProvider } from "react-router-dom";
import App from "@/app/App";
import { QueryBoundary } from "@/components/feedback/QueryBoundary";
import { messages } from "@/messages";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

const queryClient = createQueryClient({
  notifyError: (error, message, id) => {
    toast.error(error instanceof ApiError ? error.message : message, {
      id,
      duration: Infinity,
    });
  },
  shouldRetry: (error) =>
    !(error instanceof ZodError) &&
    !(error instanceof ApiError && error.status && error.status >= 400 && error.status < 500),
});

const Application =
  import.meta.env.MODE === "viewer"
    ? App
    : lazy(() =>
        import.meta.env.MODE === "editor"
          ? import("@/auth/OnlineSession")
          : import("@/auth/EditorSession"),
      );
const application =
  import.meta.env.MODE !== "viewer" ? (
    <QueryBoundary errorMessage={messages.auth.loadFailed}>
      <Application />
    </QueryBoundary>
  ) : (
    <Application />
  );

const routes =
  import.meta.env.MODE !== "viewer"
    ? [
        { path: "/", element: application },
        { path: "/d/:dashboardId/*", element: application },
      ]
    : [{ path: "*", element: application }];

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createHashRouter(routes)} />
      <Toaster closeButton position="bottom-right" />
    </QueryClientProvider>
  </StrictMode>,
);
