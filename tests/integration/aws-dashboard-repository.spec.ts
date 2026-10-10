import { test, expect } from "@playwright/test";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createAwsDashboardRepository } from "@dashivo/infra-cdk/persistence/aws-dashboard-repository";
import { createEmptyDashboard } from "@dashivo/shared-schema/dashboard";
import { DashboardIdConflict } from "@dashivo/server/models/dashboard-id-conflict";
import { DashboardNotFound } from "@dashivo/server/models/dashboard-not-found";
import { DashboardRevisionConflict } from "@dashivo/server/models/dashboard-revision-conflict";
import { InputSourceConflict } from "@dashivo/server/models/input-source-conflict";
import { createAuthenticatedServerApp } from "@dashivo/server/authentication";
import { dashboardsEndpoint } from "@dashivo/shared-schema/api";

const ownerId = "e58f017d-30d8-49b2-a056-b79688e79971";
const otherOwner = "b0acec2c-3999-4113-8e63-e5db3d02caa1";
const database = new DynamoDBClient({ region: "ap-northeast-1" });
const dynamo = DynamoDBDocumentClient.from(database, {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({ region: "ap-northeast-1" });
const dbMock = mockClient(dynamo);
const s3Mock = mockClient(s3);
const repository = (owner = ownerId) =>
  createAwsDashboardRepository({
    ownerId: owner,
    tableName: "dashboards",
    assetsBucket: "assets",
    dynamo,
    s3,
  });
const dashboard = createEmptyDashboard("Example");
const definition = {
  id: "example",
  dashboard,
  version: "version-1",
  updatedAt: "2026-10-11T00:00:00.000Z",
};
const conflict = () =>
  Object.assign(new Error("Transaction cancelled"), {
    name: "TransactionCanceledException",
    CancellationReasons: [{ Code: "ConditionalCheckFailed" }],
  });

test.beforeEach(() => {
  dbMock.reset();
  s3Mock.reset();
  dbMock.on(GetCommand).resolves({ Item: definition });
  dbMock.on(TransactWriteCommand).resolves({});
  s3Mock.on(PutObjectCommand).resolves({});
});

test.afterAll(() => {
  dbMock.restore();
  s3Mock.restore();
  database.destroy();
  s3.destroy();
});

test("verified owners isolate identical dashboard IDs and reject unsafe identifiers", async () => {
  await repository().readDashboard("example");
  await repository(otherOwner).readDashboard("example");
  const calls = dbMock.commandCalls(GetCommand);
  expect(calls.map((call) => call.args[0].input.Key)).toEqual([
    { pk: `USER#${ownerId}`, sk: "DASHBOARD#example" },
    { pk: `USER#${otherOwner}`, sk: "DASHBOARD#example" },
  ]);
  expect(calls.every((call) => call.args[0].input.ConsistentRead)).toBe(true);
  expect(() => repository("../another-user")).toThrow();
  await expect(repository().readDashboard("../other")).rejects.toThrow();
});

test("listing queries only the owner partition and follows pagination", async () => {
  dbMock
    .on(QueryCommand)
    .resolvesOnce({
      Items: [definition],
      LastEvaluatedKey: { pk: `USER#${ownerId}`, sk: "DASHBOARD#example" },
    })
    .resolves({ Items: [{ ...definition, id: "newer", updatedAt: "2026-10-12T00:00:00.000Z" }] });
  expect((await repository().listDashboards()).map((item) => item.id)).toEqual([
    "newer",
    "example",
  ]);
  const calls = dbMock.commandCalls(QueryCommand);
  expect(calls).toHaveLength(2);
  expect(calls[0].args[0].input.ExpressionAttributeValues).toEqual({
    ":pk": `USER#${ownerId}`,
    ":prefix": "DASHBOARD#",
  });
  expect(calls[1].args[0].input.ExclusiveStartKey).toEqual({
    pk: `USER#${ownerId}`,
    sk: "DASHBOARD#example",
  });
});

test("missing dashboard never reads or writes source storage", async () => {
  dbMock.on(GetCommand).resolves({});
  await expect(repository().createInput("missing", "input.csv", "a\n1")).rejects.toBeInstanceOf(
    DashboardNotFound,
  );
  expect(s3Mock.calls()).toHaveLength(0);
  expect(dbMock.commandCalls(TransactWriteCommand)).toHaveLength(0);
});

test("duplicate IDs and stale versions map to application conflicts", async () => {
  dbMock.on(TransactWriteCommand).rejects(conflict());
  await expect(repository().createDashboard("example", dashboard)).rejects.toBeInstanceOf(
    DashboardIdConflict,
  );
  await expect(repository().writeDashboard("example", dashboard, "stale")).rejects.toBeInstanceOf(
    DashboardRevisionConflict,
  );
  const put = dbMock.commandCalls(TransactWriteCommand)[1].args[0].input.TransactItems?.[0].Put;
  expect(put?.ConditionExpression).toBe("#version = :version");
  expect(put?.ExpressionAttributeValues).toEqual({ ":version": "stale" });
  expect(put?.Item?.version).not.toBe("stale");
});

test("Python registration submits definition and source in one conditional transaction", async () => {
  await repository().registerPythonLogicAtomically("example", {
    dashboard,
    expectedVersion: "version-1",
    logic: {
      id: "summary",
      path: "logic/summary.py",
      source: "def execute(inputs, params): return {}",
    },
  });
  const transactions = dbMock.commandCalls(TransactWriteCommand);
  expect(transactions).toHaveLength(1);
  const items = transactions[0].args[0].input.TransactItems!;
  expect(items).toHaveLength(2);
  expect(items[0].Put?.ConditionExpression).toBe("#version = :version");
  expect(items[1].Put?.Item).toMatchObject({
    pk: `USER#${ownerId}`,
    sk: "LOGIC#example#logic/summary.py",
    source: "def execute(inputs, params): return {}",
  });
  expect(items[1].Put?.ConditionExpression).toBe("attribute_not_exists(pk)");
  expect(s3Mock.calls()).toHaveLength(0);
});

test("CSV content is uploaded before its reference and duplicate paths never overwrite references", async () => {
  const order: string[] = [];
  s3Mock.on(PutObjectCommand).callsFake(async () => {
    order.push("s3");
    return {};
  });
  dbMock.on(TransactWriteCommand).callsFake(async () => {
    order.push("db");
    return {};
  });
  expect(await repository().createInput("example", "input.csv", "a\n1")).toBe("data/input.csv");
  expect(order).toEqual(["s3", "db"]);
  const object = s3Mock.commandCalls(PutObjectCommand)[0].args[0].input;
  expect(object.Key).toMatch(new RegExp(`^users/${ownerId}/dashboards/example/csv/[a-f0-9]{64}$`));
  const transaction = dbMock.commandCalls(TransactWriteCommand)[0].args[0].input.TransactItems!;
  expect(transaction[0].ConditionCheck?.Key?.sk).toBe("DASHBOARD#example");
  expect(transaction[1].Put?.Item?.objectKey).toBe(object.Key);
  expect(transaction[1].Put?.ConditionExpression).toBe("attribute_not_exists(pk)");
  dbMock.on(TransactWriteCommand).rejects(conflict());
  await expect(repository().createInput("example", "input.csv", "a\n2")).rejects.toBeInstanceOf(
    InputSourceConflict,
  );
});

test("CSV reads consume the stream and reject references outside the owner", async () => {
  const path = "data/input.csv";
  dbMock
    .on(GetCommand, { Key: { pk: `USER#${ownerId}`, sk: `CSV#example#${path}` } })
    .resolves({ Item: { objectKey: `users/${ownerId}/dashboards/example/csv/hash` } });
  let consumed = false;
  s3Mock.on(GetObjectCommand).resolves({
    Body: {
      transformToString: async () => {
        consumed = true;
        return "a\n1";
      },
    } as never,
  });
  expect(await repository().readInput("example", path)).toBe("a\n1");
  expect(consumed).toBe(true);
  dbMock
    .on(GetCommand, { Key: { pk: `USER#${ownerId}`, sk: `CSV#example#${path}` } })
    .resolves({ Item: { objectKey: `users/${otherOwner}/dashboards/example/csv/hash` } });
  await expect(repository().readInput("example", path)).rejects.toThrow(
    "Invalid CSV storage reference",
  );
  expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(1);
});

test("dashboard registration publishes all references atomically and retries preserve server edits", async () => {
  dbMock.on(GetCommand).resolves({});
  await repository().registerDashboardAtomically("example", dashboard, {
    "data/input.csv": "a\n1",
    "logic/run.py": "pass",
  });
  const items = dbMock.commandCalls(TransactWriteCommand)[0].args[0].input.TransactItems!;
  expect(items).toHaveLength(3);
  expect(items.every((item) => item.Put?.ConditionExpression === "attribute_not_exists(pk)")).toBe(
    true,
  );
  dbMock
    .on(GetCommand)
    .resolves({ Item: { ...definition, dashboard: { ...dashboard, title: "Server edit" } } });
  expect((await repository().registerDashboardAtomically("example", dashboard, {})).title).toBe(
    "Server edit",
  );
  expect(dbMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
  expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(1);
});

test("a concurrent registration returns the committed winner without overwriting it", async () => {
  dbMock.on(GetCommand).resolvesOnce({}).resolves({ Item: definition });
  dbMock.on(TransactWriteCommand).rejects(conflict());
  expect((await repository().registerDashboardAtomically("example", dashboard, {})).id).toBe(
    "example",
  );
  expect(dbMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
});

test("invalid paths and excessive imports fail before CSV uploads", async () => {
  dbMock.on(GetCommand).resolves({});
  await expect(
    repository().registerDashboardAtomically("example", dashboard, {
      "data/a.csv": "a",
      "logic/../escape.py": "pass",
    }),
  ).rejects.toThrow();
  const sources = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`data/${i}.csv`, "a"]));
  await expect(
    repository().registerDashboardAtomically("example", dashboard, sources),
  ).rejects.toMatchObject({ status: 413 });
  await expect(
    repository().createDashboard("example", { ...dashboard, description: "x".repeat(400_000) }),
  ).rejects.toMatchObject({ status: 413 });
  expect(s3Mock.calls()).toHaveLength(0);
  expect(dbMock.commandCalls(TransactWriteCommand)).toHaveLength(0);
});

test("S3 and infrastructure failures propagate without removing potentially committed data", async () => {
  s3Mock.on(PutObjectCommand).rejects(new Error("S3 unavailable"));
  await expect(repository().createInput("example", "input.csv", "a")).rejects.toThrow(
    "S3 unavailable",
  );
  expect(dbMock.commandCalls(TransactWriteCommand)).toHaveLength(0);
  s3Mock.on(PutObjectCommand).resolves({});
  dbMock.on(TransactWriteCommand).rejects(new Error("Response lost after commit"));
  await expect(repository().createInput("example", "input.csv", "a")).rejects.toThrow(
    "Response lost after commit",
  );
  expect(s3Mock.calls().every((call) => call.args[0] instanceof PutObjectCommand)).toBe(true);
});

test("source editing and deletion require existing files and do not upsert accidentally", async () => {
  await repository().writePython("example", "logic/run.py", "pass");
  await repository().deletePython("example", "logic/run.py");
  const calls = dbMock.commandCalls(TransactWriteCommand);
  expect(calls[0].args[0].input.TransactItems?.[1].Put?.ConditionExpression).toBe(
    "attribute_exists(pk)",
  );
  expect(calls[1].args[0].input.TransactItems?.[1].Delete?.ConditionExpression).toBe(
    "attribute_exists(pk)",
  );
  dbMock.on(TransactWriteCommand).rejects(conflict());
  await expect(
    repository().writePython("example", "logic/missing.py", "pass"),
  ).rejects.toMatchObject({ status: 404 });
});

test("SDK failures unrelated to conditions are not reported as user conflicts", async () => {
  const unavailable = Object.assign(new Error("Transaction capacity unavailable"), {
    name: "TransactionCanceledException",
    CancellationReasons: [{ Code: "ProvisionedThroughputExceeded" }],
  });
  dbMock.on(TransactWriteCommand).rejects(unavailable);
  await expect(repository().createDashboard("example", dashboard)).rejects.toThrow(
    "Transaction capacity unavailable",
  );
});

test("the authenticated server selects the repository from verified sub, not request owner", async () => {
  dbMock.on(QueryCommand).resolves({ Items: [] });
  const app = createAuthenticatedServerApp({
    verifyAccessToken: async () => ({ sub: ownerId }),
    repositoryForUser: repository,
    dashboardHtmlBuilder: async () => new ArrayBuffer(0),
    downloadStorageForUser: () => async () => "https://example.com/download",
  });
  expect((await app.request(dashboardsEndpoint)).status).toBe(401);
  expect(dbMock.calls()).toHaveLength(0);
  const response = await app.request(`${dashboardsEndpoint}?ownerId=${otherOwner}`, {
    headers: { "X-Dashivo-Token": "verified-token" },
  });
  expect(response.status).toBe(200);
  expect(
    dbMock.commandCalls(QueryCommand)[0].args[0].input.ExpressionAttributeValues?.[":pk"],
  ).toBe(`USER#${ownerId}`);
});
