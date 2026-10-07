import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation, useSuspenseQuery } from "@dashivo/shared-lib/query";
import { Hub } from "aws-amplify/utils";
import { loadSession, logOut, signIn } from "@/auth/cognito";
import { messages } from "@/messages";

const sessionQueryKey = ["auth", "session"] as const;

export const useAuthentication = () => {
  const queryClient = useQueryClient();
  const { data: user } = useSuspenseQuery({
    queryKey: sessionQueryKey,
    queryFn: loadSession,
    retry: false,
    staleTime: Infinity,
    meta: { errorMessage: messages.auth.loadFailed, errorBoundary: true },
  });

  useEffect(
    () =>
      Hub.listen("auth", ({ payload }) => {
        const invalidSession =
          payload.event === "tokenRefresh_failure" &&
          [
            "NotAuthorizedException",
            "TokenRevokedException",
            "UserNotFoundException",
            "PasswordResetRequiredException",
            "UserNotConfirmedException",
            "RefreshTokenReuseException",
          ].some((name) => payload.data.error?.name.startsWith(name));

        if (payload.event === "signedOut" || invalidSession) {
          // ログアウトした利用者の定義・CSV・Pythonを次のセッションへ残さない。
          void queryClient.cancelQueries();
          queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
          queryClient.getMutationCache().clear();
          queryClient.setQueryData(sessionQueryKey, null);
        } else if (payload.event === "signedIn") {
          void queryClient.invalidateQueries({ queryKey: sessionQueryKey });
        }
      }),
    [queryClient],
  );

  const login = useMutation({
    mutationFn: signIn,
    meta: { errorMessage: messages.auth.signInFailed },
  });
  const logout = useMutation({
    mutationFn: logOut,
    meta: { errorMessage: messages.auth.signOutFailed },
  });

  return {
    user,
    login: login.mutate,
    logout: logout.mutate,
    pending: login.isPending || logout.isPending,
  };
};
