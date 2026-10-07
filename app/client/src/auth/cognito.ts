import { Amplify } from "aws-amplify";
import { fetchAuthSession, signInWithRedirect, signOut } from "aws-amplify/auth";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { Hub, sessionStorage } from "aws-amplify/utils";
import { toast } from "sonner";
import { ApiError } from "@/api/request";
import { messages } from "@/messages";

const redirectUrl = `${window.location.origin}/`;

// OAuthの戻り処理はReactのマウント前に完了する場合がある。
Hub.listen("auth", ({ payload }) => {
  if (payload.event === "signInWithRedirect_failure") toast.error(messages.auth.signInFailed);
});
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: new URL(import.meta.env.VITE_COGNITO_LOGIN_URL).hostname,
          scopes: ["openid", "email"],
          redirectSignIn: [redirectUrl],
          redirectSignOut: [redirectUrl],
          responseType: "code",
        },
      },
    },
  },
});
cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);

export const loadSession = async () => {
  const { tokens } = await fetchAuthSession();
  if (!tokens) return null;

  return { userId: tokens.accessToken.payload.sub, email: tokens.idToken?.payload.email };
};

export const getAccessToken = async () => {
  const { tokens } = await fetchAuthSession();
  if (!tokens) throw new ApiError(messages.auth.sessionExpired, 401);

  return tokens.accessToken.toString();
};

export const signIn = () => signInWithRedirect();
export const logOut = () => signOut();
