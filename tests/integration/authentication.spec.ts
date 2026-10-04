import { generateKeyPairSync, sign } from "node:crypto";
import { expect, test } from "@playwright/test";
import { FetchError } from "aws-jwt-verify/error";
import { SimpleJwksCache } from "aws-jwt-verify/jwk";
import { createCognitoAccessTokenVerifier } from "@dashivo/infra-cdk/auth/cognito";
import { createAuthenticatedServerApp } from "@dashivo/server/authentication";
import type { DashboardRepository } from "@dashivo/server/models/dashboard-repository";
import { dashboardItemEndpoint, dashboardsEndpoint } from "@dashivo/shared-schema/api";
import { dashboardSchema } from "@dashivo/shared-schema/dashboard";
import source from "#dashboard/dashboard.json" with { type: "json" };

const poolId = "ap-northeast-1_Test";
const clientId = "test-client";
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = publicKey.export({ format: "jwk" });
const jwksCache = new SimpleJwksCache();
jwksCache.addJwks(
  `https://cognito-idp.ap-northeast-1.amazonaws.com/${poolId}/.well-known/jwks.json`,
  { keys: [{ ...jwk, kty: "RSA", kid: "test-key", use: "sig", alg: "RS256" }] },
);
const verifyAccessToken = createCognitoAccessTokenVerifier(poolId, clientId, jwksCache);

const createToken = (sub: string, overrides: Record<string, unknown> = {}) => {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test-key" })).toString(
    "base64url",
  );
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      iss: `https://cognito-idp.ap-northeast-1.amazonaws.com/${poolId}`,
      client_id: clientId,
      token_use: "access",
      exp: Math.floor(Date.now() / 1000) + 600,
      ...overrides,
    }),
  ).toString("base64url");
  const message = `${header}.${payload}`;
  return `${message}.${sign("RSA-SHA256", Buffer.from(message), privateKey).toString("base64url")}`;
};

const createRepository = (userId: string): DashboardRepository => ({
  listDashboards: async () => [
    { id: "shared-id", title: userId, updatedAt: "2026-01-01T00:00:00.000Z" },
  ],
  createDashboard: async () => {
    throw new Error("Not used");
  },
  readDashboard: async (id) => {
    if (id !== "shared-id") throw new Error("Not used");
    return { dashboard: { ...dashboardSchema.parse(source), title: userId }, version: "v1" };
  },
  writeDashboard: async () => {
    throw new Error("Not used");
  },
  listAssets: async () => ({ csv: [], python: [] }),
  readInput: async () => {
    throw new Error("Not used");
  },
  createInput: async () => {
    throw new Error("Not used");
  },
  readPython: async () => {
    throw new Error("Not used");
  },
  writePython: async () => {
    throw new Error("Not used");
  },
  createPython: async () => {
    throw new Error("Not used");
  },
  deletePython: async () => {
    throw new Error("Not used");
  },
  registerPythonLogicAtomically: async () => {
    throw new Error("Not used");
  },
});

const createTestApp = (owners: string[]) =>
  createAuthenticatedServerApp({
    verifyAccessToken,
    repositoryForUser: (userId) => {
      owners.push(userId);
      return createRepository(userId);
    },
    dashboardHtmlBuilder: async () => new ArrayBuffer(0),
  });

test("rejects missing, expired, malformed and wrong-use tokens before resolving storage", async () => {
  const owners: string[] = [];
  const app = createTestApp(owners);
  for (const token of [
    undefined,
    "not-a-token",
    createToken("user-a", { exp: 1 }),
    createToken("user-a", { token_use: "id", aud: clientId }),
    createToken("user-a", { client_id: "other-client" }),
    createToken("user-a", { iss: "https://invalid.example.com" }),
    createToken(""),
  ]) {
    const response = await app.request(dashboardsEndpoint, {
      headers: token ? { "X-Dashivo-Token": token } : {},
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  }
  expect(owners).toEqual([]);
});

test("a modified signed payload cannot choose a different storage owner", async () => {
  const owners: string[] = [];
  const app = createTestApp(owners);
  const [header, payload, signature] = createToken("user-a").split(".");
  const forged = Buffer.from(
    JSON.stringify({
      ...JSON.parse(Buffer.from(payload, "base64url").toString()),
      sub: "user-b",
    }),
  ).toString("base64url");
  const response = await app.request(dashboardsEndpoint, {
    headers: { "X-Dashivo-Token": `${header}.${forged}.${signature}` },
  });
  expect(response.status).toBe(401);
  expect(owners).toEqual([]);
});

test("simultaneous requests bind services to the verified subject, not user-supplied IDs", async () => {
  const owners: string[] = [];
  const app = createTestApp(owners);
  const responses = await Promise.all(
    ["user-a", "user-b"].map((userId) =>
      app.request(`${dashboardItemEndpoint("shared-id")}?userId=attacker`, {
        headers: { "X-Dashivo-Token": createToken(userId), "X-User-Id": "attacker" },
      }),
    ),
  );
  expect(responses.map((response) => response.status)).toEqual([200, 200]);
  const results = await Promise.all(responses.map((response) => response.json()));
  expect(results.map((result) => result.dashboard.title)).toEqual(["user-a", "user-b"]);
  expect(owners.toSorted()).toEqual(["user-a", "user-b"]);
});

test("JWKS network failures are not reported as invalid credentials", async () => {
  const failure = new FetchError("https://example.com/jwks", "Network unavailable");
  const unavailableCache = new SimpleJwksCache({
    fetcher: {
      fetch: async () => {
        throw failure;
      },
    },
  });
  const verify = createCognitoAccessTokenVerifier(poolId, clientId, unavailableCache);

  await expect(verify(createToken("user-a"))).rejects.toBe(failure);
});
