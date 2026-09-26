import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHashRouter, RouterProvider } from "react-router-dom";
import App from "@/app/App";
import { appTarget } from "virtual:dashlet/app-target";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

const queryClient = new QueryClient();
const routes =
  appTarget === "editor"
    ? [
        { path: "/", element: <App /> },
        { path: "/d/:dashboardId/*", element: <App /> },
      ]
    : [{ path: "*", element: <App /> }];

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createHashRouter(routes)} />
    </QueryClientProvider>
  </StrictMode>,
);
