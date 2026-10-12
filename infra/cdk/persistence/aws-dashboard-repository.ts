import { createHash, randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import {
  GetCommand,
  TransactWriteCommand,
  paginateQuery,
  type DynamoDBDocumentClient,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import {
  dashboardIdSchema,
  dashboardSchema,
  inputSourcePathSchema,
  pythonSourcePathSchema,
  type DashboardSchema,
} from "@dashivo/shared-schema/dashboard";
import type { DashboardRepository } from "@dashivo/server/models/dashboard-repository";
import { DashboardNotFound } from "@dashivo/server/models/dashboard-not-found";
import { DashboardIdConflict } from "@dashivo/server/models/dashboard-id-conflict";
import { DashboardRevisionConflict } from "@dashivo/server/models/dashboard-revision-conflict";
import { InputSourceConflict } from "@dashivo/server/models/input-source-conflict";

interface RepositoryOptions {
  /** Cognito sub after JWT verification, never a request parameter. */
  ownerId: string;
  tableName: string;
  assetsBucket: string;
  dynamo: DynamoDBDocumentClient;
  s3: S3Client;
}

const definitionSchema = z.object({
  id: dashboardIdSchema,
  dashboard: dashboardSchema,
  version: z.string(),
  updatedAt: z.string(),
});

const summary = (item: z.infer<typeof definitionSchema>) => ({
  id: item.id,
  title: item.dashboard.title,
  updatedAt: item.updatedAt,
});

const isConditionFailure = (error: unknown) =>
  error instanceof Error &&
  (error.name === "ConditionalCheckFailedException" ||
    (error.name === "TransactionCanceledException" &&
      "CancellationReasons" in error &&
      Array.isArray(error.CancellationReasons) &&
      (error.CancellationReasons as { Code?: string }[]).some(
        (reason) => reason.Code === "ConditionalCheckFailed",
      )));

export const createAwsDashboardRepository = ({
  ownerId,
  tableName,
  assetsBucket,
  dynamo,
  s3,
}: RepositoryOptions): DashboardRepository => {
  // Cognito sub is GUID-shaped but does not guarantee RFC UUID version/variant bits.
  const owner = z.guid().parse(ownerId);
  const pk = `USER#${owner}`;
  const key = (sk: string) => ({ pk, sk });
  const definitionKey = (id: string) => key(`DASHBOARD#${dashboardIdSchema.parse(id)}`);
  const sourceKey = (id: string, path: string) => {
    const type = path.startsWith("data/") ? "CSV" : "LOGIC";
    (type === "CSV" ? inputSourcePathSchema : pythonSourcePathSchema).parse(path);
    return key(`${type}#${dashboardIdSchema.parse(id)}#${path}`);
  };

  const get = async (Key: ReturnType<typeof key>) =>
    (await dynamo.send(new GetCommand({ TableName: tableName, Key, ConsistentRead: true }))).Item;

  const findDefinition = async (id: string) => {
    const item = await get(definitionKey(id));
    return item ? definitionSchema.parse(item) : undefined;
  };

  const readDefinition = async (id: string) => {
    const item = await findDefinition(id);
    if (!item) throw new DashboardNotFound(id);
    return item;
  };

  const query = async (prefix: string) => {
    const items: Record<string, unknown>[] = [];
    for await (const page of paginateQuery(
      { client: dynamo },
      {
        TableName: tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: { ":pk": pk, ":prefix": prefix },
        ConsistentRead: true,
      },
    )) {
      items.push(...(page.Items ?? []));
    }
    return items;
  };

  const definitionPut = (id: string, dashboard: DashboardSchema, expectedVersion?: string) => ({
    TableName: tableName,
    Item: {
      ...definitionKey(id),
      id,
      dashboard: dashboardSchema.parse(dashboard),
      version: randomUUID(),
      updatedAt: new Date().toISOString(),
    },
    ConditionExpression:
      expectedVersion !== undefined ? "#version = :version" : "attribute_not_exists(pk)",
    ...(expectedVersion !== undefined && {
      ExpressionAttributeNames: { "#version": "version" },
      ExpressionAttributeValues: { ":version": expectedVersion },
    }),
  });

  const transact = async (
    TransactItems: NonNullable<TransactWriteCommandInput["TransactItems"]>,
  ) => {
    // Leave headroom for DynamoDB attribute-name overhead (400 KiB/item, 4 MiB/transaction).
    if (
      TransactItems.length > 100 ||
      TransactItems.some((item) => Buffer.byteLength(JSON.stringify(item)) > 350_000) ||
      Buffer.byteLength(JSON.stringify(TransactItems)) > 3_500_000
    ) {
      throw new HTTPException(413, { message: "保存可能な定義・Pythonのサイズを超えています。" });
    }
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems,
        ClientRequestToken: randomUUID(),
      }),
    );
  };

  const sourcePut = async (id: string, path: string, source: string) => {
    const Key = sourceKey(id, path);
    if (path.startsWith("logic/")) return { ...Key, path, source };

    const digest = createHash("sha256").update(source).digest("hex");
    const objectKey = `users/${owner}/dashboards/${id}/csv/${digest}`;
    // Content-addressed objects can be shared by retries; never delete on ambiguous DB failures.
    await s3.send(
      new PutObjectCommand({
        Bucket: assetsBucket,
        Key: objectKey,
        Body: source,
        ContentType: "text/csv; charset=utf-8",
      }),
    );
    return { ...Key, path, objectKey };
  };

  const changeSource = async (
    id: string,
    path: string,
    source: string | undefined,
    create: boolean,
  ) => {
    await readDefinition(id);
    const Key = sourceKey(id, path);
    const condition = create ? "attribute_not_exists(pk)" : "attribute_exists(pk)";
    const operation =
      source === undefined
        ? { Delete: { TableName: tableName, Key, ConditionExpression: condition } }
        : {
            Put: {
              TableName: tableName,
              Item: await sourcePut(id, path, source),
              ConditionExpression: condition,
            },
          };

    try {
      await transact([
        {
          ConditionCheck: {
            TableName: tableName,
            Key: definitionKey(id),
            ConditionExpression: "attribute_exists(pk)",
          },
        },
        operation,
      ]);
    } catch (error) {
      if (!isConditionFailure(error)) throw error;
      if (create && path.startsWith("data/")) throw new InputSourceConflict();
      if (create) throw new DashboardRevisionConflict();
      throw new HTTPException(404, { message: "対象のファイルが見つかりません。" });
    }
  };

  return {
    async listDashboards() {
      return (await query("DASHBOARD#"))
        .map((item) => summary(definitionSchema.parse(item)))
        .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async createDashboard(id, dashboard) {
      const Put = definitionPut(id, dashboard);
      try {
        await transact([{ Put }]);
      } catch (error) {
        if (isConditionFailure(error)) throw new DashboardIdConflict();
        throw error;
      }
      return summary(Put.Item);
    },
    async readDashboard(id) {
      const { dashboard, version } = await readDefinition(id);
      return { dashboard, version };
    },
    async writeDashboard(id, dashboard, expectedVersion) {
      try {
        await transact([{ Put: definitionPut(id, dashboard, expectedVersion) }]);
      } catch (error) {
        if (isConditionFailure(error)) throw new DashboardRevisionConflict();
        throw error;
      }
    },
    async listAssets(id) {
      await readDefinition(id);
      const [csv, python] = await Promise.all([query(`CSV#${id}#`), query(`LOGIC#${id}#`)]);
      return {
        csv: csv.map((item) => inputSourcePathSchema.parse(item.path)).toSorted(),
        python: python.map((item) => pythonSourcePathSchema.parse(item.path)).toSorted(),
      };
    },
    async readInput(id, path) {
      inputSourcePathSchema.parse(path);
      await readDefinition(id);
      const item = await get(sourceKey(id, path));
      if (!item) throw new HTTPException(404, { message: "CSVが見つかりません。" });
      const objectKey = z.string().parse(item.objectKey);
      if (!objectKey.startsWith(`users/${owner}/dashboards/${id}/csv/`)) {
        throw new Error("Invalid CSV storage reference");
      }
      const { Body } = await s3.send(
        new GetObjectCommand({ Bucket: assetsBucket, Key: objectKey }),
      );
      if (!Body) throw new Error("CSV response body is missing");
      return Body.transformToString();
    },
    async createInput(id, fileName, source) {
      const path = inputSourcePathSchema.parse(`data/${fileName}`);
      await changeSource(id, path, source, true);
      return path;
    },
    async readPython(id, path) {
      pythonSourcePathSchema.parse(path);
      await readDefinition(id);
      const item = await get(sourceKey(id, path));
      if (!item) throw new HTTPException(404, { message: "Pythonが見つかりません。" });
      return z.string().parse(item.source);
    },
    writePython: (id, path, source) =>
      changeSource(id, pythonSourcePathSchema.parse(path), source, false),
    createPython: (id, path, source) =>
      changeSource(id, pythonSourcePathSchema.parse(path), source, true),
    deletePython: (id, path) =>
      changeSource(id, pythonSourcePathSchema.parse(path), undefined, false),
    async registerPythonLogicAtomically(id, { dashboard, expectedVersion, logic }) {
      try {
        await transact([
          { Put: definitionPut(id, dashboard, expectedVersion) },
          {
            Put: {
              TableName: tableName,
              Item: await sourcePut(id, pythonSourcePathSchema.parse(logic.path), logic.source),
              ConditionExpression: "attribute_not_exists(pk)",
            },
          },
        ]);
      } catch (error) {
        if (isConditionFailure(error)) throw new DashboardRevisionConflict();
        throw error;
      }
    },
    async registerDashboardAtomically(id, dashboard, sources) {
      const existing = await findDefinition(id);
      if (existing) return summary(existing);
      const Put = definitionPut(id, dashboard);
      // Validate every path and the transaction count before uploading any CSV.
      const entries = Object.entries(sources);
      if (entries.length > 99)
        throw new HTTPException(413, { message: "一度に登録できるファイルは99件までです。" });
      for (const [path] of entries) sourceKey(id, path);
      const files = [];
      for (const [path, source] of entries) {
        files.push({
          Put: {
            TableName: tableName,
            Item: await sourcePut(id, path, source),
            ConditionExpression: "attribute_not_exists(pk)",
          },
        });
      }
      try {
        await transact([{ Put }, ...files]);
      } catch (error) {
        if (!isConditionFailure(error)) throw error;
        const winner = await findDefinition(id);
        if (!winner) throw error;
        return summary(winner);
      }
      return summary(Put.Item);
    },
  };
};
