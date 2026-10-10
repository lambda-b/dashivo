import { useIsMutating } from "@tanstack/react-query";
import { EditorWorkspace } from "@/auth/EditorSession";
import { useAuthentication } from "@/auth/useAuthentication";
import { Button } from "@/components/primitives/Button";

const OnlineSession = () => {
  const { user, login, logout, pending } = useAuthentication();
  const saving = useIsMutating({ mutationKey: ["workspace"] }) > 0;

  return (
    <EditorWorkspace authenticated={!!user} scope={user ? `user:${user.userId}` : "guest"}>
      {typeof user?.email === "string" && <span className="truncate">{user.email}</span>}
      <Button onClick={() => (user ? logout() : login())} disabled={saving} pending={pending}>
        {user ? "ログアウト" : "ログイン"}
      </Button>
    </EditorWorkspace>
  );
};

export default OnlineSession;
