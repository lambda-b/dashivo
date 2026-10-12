import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { expect, test } from "@playwright/test";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { createFilesystemDashboardDownloadStorage } from "@dashivo/infra/local/persistence/filesystem-dashboard-download-storage";
import { createAwsDashboardDownloadStorage } from "@dashivo/infra-cdk/persistence/aws-dashboard-download-storage";
import { dashboardDownloadResponseSchema } from "@dashivo/shared-schema/api";

// Synthetic Cognito sub: the variant is intentionally not RFC UUID-compatible.
const ownerId = "e58f017d-30d8-79b2-c056-b79688e79971";
const html = new TextEncoder().encode("<!doctype html><title>Viewer</title>").buffer;

test("local downloads use the same URL contract, expire, and reject invalid paths", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dashivo-download-test-"));
  try {
    const storage = createFilesystemDashboardDownloadStorage(root);
    const url = await storage.save("example", html);
    expect(dashboardDownloadResponseSchema.parse({ url })).toEqual({ url });
    const [, , , token, id] = url.split("/");
    expect(await storage.read(token, id)).toEqual(html);
    await expect(storage.read("..", "example")).rejects.toMatchObject({ status: 404 });
    await expect(storage.read(token, "../private")).rejects.toMatchObject({ status: 404 });
    await expect(storage.read(token, "other")).rejects.toMatchObject({ status: 404 });

    const past = new Date(Date.now() - 301_000);
    await fs.utimes(path.join(root, token, "example.html"), past, past);
    await expect(storage.read(token, id)).rejects.toMatchObject({ status: 410 });

    const yesterday = new Date(Date.now() - 86_401_000);
    await fs.utimes(path.join(root, token), yesterday, yesterday);
    await storage.save("example", html);
    await expect(fs.access(path.join(root, token))).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("AWS downloads accept non-RFC Cognito sub and sign an owner-scoped five-minute GET", async () => {
  const s3 = new S3Client({
    region: "ap-northeast-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  });
  const mock = mockClient(s3);
  mock.on(PutObjectCommand).resolves({});
  try {
    const save = createAwsDashboardDownloadStorage({ ownerId, bucket: "downloads", s3 });
    const first = new URL(await save("example", html));
    const second = new URL(await save("example", html));
    expect(first.hostname).toBe("downloads.s3.ap-northeast-1.amazonaws.com");
    expect(first.pathname).toMatch(
      new RegExp(`^/users/${ownerId}/dashboards/example/[^/]+\\.html$`),
    );
    expect(first.pathname).not.toBe(second.pathname);
    expect(first.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(first.searchParams.get("X-Amz-Signature")).toBeTruthy();
    expect(dashboardDownloadResponseSchema.parse({ url: first.href }).url).toBe(first.href);
    expect(mock.commandCalls(PutObjectCommand)[0].args[0].input).toMatchObject({
      Bucket: "downloads",
      Body: new Uint8Array(html),
      ContentType: "text/html; charset=utf-8",
      ContentDisposition: 'attachment; filename="example.html"',
      CacheControl: "private, no-store",
    });

    mock.on(PutObjectCommand).rejects(new Error("Storage unavailable"));
    await expect(save("example", html)).rejects.toThrow("Storage unavailable");
    await expect(save("../other", html)).rejects.toThrow();
    expect(() =>
      createAwsDashboardDownloadStorage({ ownerId: "../other", bucket: "downloads", s3 }),
    ).toThrow();
  } finally {
    mock.restore();
    s3.destroy();
  }
});

test("download URLs reject executable and protocol-relative URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "//outside.example.com",
    "http://outside.example.com",
  ]) {
    expect(dashboardDownloadResponseSchema.safeParse({ url }).success).toBe(false);
  }
});
