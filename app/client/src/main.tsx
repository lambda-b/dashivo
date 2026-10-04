import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { createQueryClient } from "@/app/query-client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import App from "@/app/App";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

const queryClient = createQueryClient();
const routes =
  import.meta.env.MODE !== "viewer"
    ? [
        { path: "/", element: <App /> },
        { path: "/d/:dashboardId/*", element: <App /> },
      ]
    : [{ path: "*", element: <App /> }];

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createHashRouter(routes)} />
      <Toaster closeButton position="bottom-right" />
    </QueryClientProvider>
  </StrictMode>,
);
