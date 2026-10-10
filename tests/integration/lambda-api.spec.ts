import { expect, test } from "@playwright/test";
import { HTTPException } from "hono/http-exception";
import type { LambdaEvent } from "hono/aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { createLambdaHandler } from "@dashivo/infra-cdk/lambda/app";
import { createAwsDashboardRepository } from "@dashivo/infra-cdk/persistence/aws-dashboard-repository";
import { createEmptyDashboard } from "@dashivo/shared-schema/dashboard";
import { dashboardsEndpoint, dashboardDownloadEndpoint } from "@dashivo/shared-schema/api";

const ownerId = "e58f017d-30d8-49b2-a056-b79688e79971";
const database = new DynamoDBClient({ region: "ap-northeast-1" });
const dynamo = DynamoDBDocumentClient.from(database, {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({ region: "ap-northeast-1" });
const dbMock = mockClient(dynamo);
const definition = {
  id: "example",
  dashboard: createEmptyDashboard("Example"),
  version: "v1",
  updatedAt: "2026-10-11T00:00:00.000Z",
};
const handler = createLambdaHandler({
  verifyAccessToken: async (token) => {
    if (token !== "valid") throw new HTTPException(401, { message: "Unauthorized" });
    return { sub: ownerId };
  },
  repositoryForUser: (ownerId) =>
    createAwsDashboardRepository({
      ownerId,
      dynamo,
      s3,
      tableName: "dashboards",
      assetsBucket: "assets",
    }),
  dashboardHtmlBuilder: async () => {
    throw new HTTPException(501, { message: "HTMLダウンロードはまだ準備中です。" });
  },
});

const event = (path: string, method = "GET", body?: string, token?: string): LambdaEvent => ({
  version: "2.0",
  routeKey: "$default",
  rawPath: path,
  rawQueryString: "",
  headers: {
    host: "example.lambda-url.ap-northeast-1.on.aws",
    "content-type": "application/json",
    ...(token && { "x-dashivo-token": token }),
  },
  requestContext: {
    accountId: "111111111111",
    apiId: "example",
    authentication: null,
    authorizer: {},
    domainName: "example.lambda-url.ap-northeast-1.on.aws",
    domainPrefix: "example",
    http: { method, path, protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "test" },
    requestId: "request",
    routeKey: "$default",
    stage: "$default",
    time: "11/Oct/2026:00:00:00 +0000",
    timeEpoch: 0,
  },
  body: body ?? null,
  isBase64Encoded: false,
});

test.beforeEach(() => {
  dbMock.reset();
  dbMock.on(QueryCommand).resolves({ Items: [definition] });
  dbMock.on(GetCommand).resolves({ Item: definition });
  dbMock.on(TransactWriteCommand).resolves({});
});
test.afterAll(() => {
  dbMock.restore();
  database.destroy();
  s3.destroy();
});

test("Function URL events require JWT before any storage access and responses are not cached", async () => {
  for (const token of [undefined, "invalid"]) {
    const response = await handler(event(dashboardsEndpoint, "GET", undefined, token));
    expect(response.statusCode).toBe(401);
    expect(response.headers?.["cache-control"]).toBe("no-store");
  }
  expect(dbMock.calls()).toHaveLength(0);
  const response = await handler(event(dashboardsEndpoint, "GET", undefined, "valid"));
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body).dashboards[0].id).toBe("example");
  expect(
    dbMock.commandCalls(QueryCommand)[0].args[0].input.ExpressionAttributeValues?.[":pk"],
  ).toBe(`USER#${ownerId}`);
});

test("base64-encoded JSON is decoded by the Hono adapter and creates a dashboard", async () => {
  const request = event(
    dashboardsEndpoint,
    "POST",
    Buffer.from(JSON.stringify({ id: "new-dashboard" })).toString("base64"),
    "valid",
  );
  request.isBase64Encoded = true;
  const response = await handler(request);
  expect(response.statusCode).toBe(201);
  expect(JSON.parse(response.body).dashboard).toMatchObject({
    id: "new-dashboard",
    title: "Untitled",
  });
  expect(dbMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
});

test("oversized payloads are rejected without storage calls", async () => {
  const response = await handler(event(dashboardsEndpoint, "POST", "x".repeat(4_000_001), "valid"));
  expect(response.statusCode).toBe(413);
  expect(dbMock.calls()).toHaveLength(0);
  expect(response.headers?.["cache-control"]).toBe("no-store");
});

test("unfinished download delivery explicitly returns 501 instead of an invalid HTML file", async () => {
  const response = await handler(
    event(dashboardDownloadEndpoint("example"), "POST", undefined, "valid"),
  );
  expect(response.statusCode).toBe(501);
  expect(JSON.parse(response.body).error).toContain("準備中");
});
