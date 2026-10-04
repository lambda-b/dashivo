import { Button } from "@/components/primitives/Button";

import { Suspense, type ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { ApiError } from "@/api/request";
import { messages } from "@/messages";

export const QueryBoundary = ({
  children,
  errorMessage,
  loadingMessage = messages.loading,
}: {
  children: ReactNode;
  errorMessage: string;
  loadingMessage?: string;
}) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        onReset={reset}
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div className="space-y-3 p-4 text-sm">
            <p role="alert" className="break-words text-red-700">
              {error instanceof ApiError ? error.message : errorMessage}
            </p>
            <Button onClick={resetErrorBoundary}>{messages.retry}</Button>
          </div>
        )}
      >
        <Suspense
          fallback={
            <p role="status" className="p-4 text-sm text-stone-500">
              {loadingMessage}
            </p>
          }
        >
          {children}
        </Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);
