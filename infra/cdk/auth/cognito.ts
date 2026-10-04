import { CognitoJwtVerifier } from "aws-jwt-verify";
import { FetchError, JwtBaseError } from "aws-jwt-verify/error";
import type { JwksCache } from "aws-jwt-verify/jwk";
import { HTTPException } from "hono/http-exception";

export const createCognitoAccessTokenVerifier = (
  userPoolId: string,
  clientId: string,
  jwksCache?: JwksCache,
) => {
  const verifier = CognitoJwtVerifier.create(
    { userPoolId, clientId, tokenUse: "access" },
    jwksCache ? { jwksCache } : undefined,
  );

  return async (token: string) => {
    try {
      return await verifier.verify(token);
    } catch (error) {
      if (error instanceof JwtBaseError && !(error instanceof FetchError))
        throw new HTTPException(401, { message: "Unauthorized" });
      throw error;
    }
  };
};
