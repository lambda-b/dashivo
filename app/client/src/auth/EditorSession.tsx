import { useState, type ReactNode } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import App from "@/app/App";
import { Checkbox } from "@/components/primitives/Checkbox";
import { browserStorage } from "@/storage/browser";
import { WorkspaceContext } from "@/storage/context";
import { serverStorage } from "@/storage/server";
import { useRegisterTrial } from "@/storage/useRegisterTrial";
import { Button } from "@/components/primitives/Button";
import { QueryBoundary } from "@/components/feedback/QueryBoundary";
import { messages } from "@/messages";
import clsx from "clsx";

const RegisteredWorkspace = ({
  authenticated,
  scope,
}: {
  authenticated: boolean;
  scope: string;
}) => {
  const registration = useRegisterTrial(authenticated, scope);
  if (authenticated && !registration.isSuccess) {
    return (
      <div className="p-5 text-sm lg:ml-72">
        {registration.isError ? (
          <Button onClick={() => registration.register()}>{messages.retry}</Button>
        ) : (
          "ダッシュボードを準備中…"
        )}
      </div>
    );
  }
  return (
    <QueryBoundary errorMessage={messages.dashboard.listLoadFailed}>
      <App />
    </QueryBoundary>
  );
};

export const EditorWorkspace = ({
  authenticated,
  scope,
  children,
}: {
  authenticated: boolean;
  scope: string;
  children: ReactNode;
}) => (
  <>
    <div
      className={clsx(
        "flex min-h-12 flex-wrap items-center justify-end gap-3 border-b border-stone-200 bg-white px-4 py-2 text-xs text-stone-600",
        authenticated && "lg:pl-72",
      )}
    >
      <span>{authenticated ? "保存先: サーバー" : "保存先: このブラウザー"}</span>
      {children}
    </div>
    <WorkspaceContext.Provider
      value={{
        scope,
        authenticated,
        storage: authenticated ? serverStorage : browserStorage,
      }}
    >
      <RegisteredWorkspace key={scope} authenticated={authenticated} scope={scope} />
    </WorkspaceContext.Provider>
  </>
);

const LocalSession = () => {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("dashivo.dev.authenticated") !== "false",
  );
  const navigate = useNavigate();
  const saving = useIsMutating() > 0;
  const scope = authenticated ? "local" : "guest";

  return (
    <EditorWorkspace authenticated={authenticated} scope={scope}>
      <fieldset
        disabled={saving}
        title={saving ? "保存中は認証状態を切り替えられません" : undefined}
      >
        <Checkbox
          name="development-authentication"
          layout="horizontal"
          options={{ value: "authenticated", label: "開発用: 認証済み", checked: authenticated }}
          onChange={([option]) => {
            sessionStorage.setItem("dashivo.dev.authenticated", String(option.checked));
            // URLと保存先を同じ描画で切り替え、旧保存先のIDで問い合わせない。
            setAuthenticated(option.checked);
            navigate("/", { replace: true, flushSync: true });
          }}
        />
      </fieldset>
    </EditorWorkspace>
  );
};

export default LocalSession;
