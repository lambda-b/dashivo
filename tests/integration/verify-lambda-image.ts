import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

const image = "dashivo-lambda-test:local";
const container = "dashivo-lambda-test";
const platform = `linux/${process.arch === "arm64" ? "arm64" : "amd64"}`;
const docker = (...args: string[]) => execFileSync("docker", args, { stdio: "inherit" });

docker("build", "--platform", platform, "-f", "infra/cdk/lambda/Dockerfile", "-t", image, ".");

docker(
  "run",
  "--detach",
  "--name",
  container,
  "--platform",
  platform,
  "--read-only",
  "--tmpfs",
  "/tmp:rw,size=512m",
  "--memory",
  "2g",
  "--publish",
  "127.0.0.1:9000:8080",
  "--env",
  "AWS_REGION=ap-northeast-1",
  "--env",
  "AWS_EC2_METADATA_DISABLED=true",
  "--env",
  "DASHBOARD_TABLE=test",
  "--env",
  "ASSETS_BUCKET=test",
  "--env",
  "DOWNLOADS_BUCKET=test",
  "--env",
  "EXPORT_SOURCE_ROOT=/var/task",
  "--env",
  "COGNITO_USER_POOL_ID=ap-northeast-1_Example",
  "--env",
  "COGNITO_CLIENT_ID=example",
  "--mount",
  `type=bind,source=${path.resolve("tests/fixtures/export-dashboard.ts")},target=/var/task/app/server/packages/exporter/smoke.ts,readonly`,
  image,
);

try {
  const response = execFileSync(
    "curl",
    [
      "--silent",
      "--show-error",
      "--fail",
      "--retry",
      "10",
      "--retry-connrefused",
      "--retry-delay",
      "1",
      "--max-time",
      "30",
      "--header",
      "Content-Type: application/json",
      "--data",
      JSON.stringify({
        version: "2.0",
        rawPath: "/api/dashboards",
        rawQueryString: "",
        headers: {},
        requestContext: { http: { method: "GET", path: "/api/dashboards" } },
        isBase64Encoded: false,
      }),
      "http://127.0.0.1:9000/2015-03-31/functions/function/invocations",
    ],
    { encoding: "utf8" },
  );
  const result = JSON.parse(response);
  assert.equal(result.statusCode, 401, response);
  assert.equal(result.headers["cache-control"], "no-store");

  docker("exec", container, "node", "app/server/packages/exporter/smoke.ts", "/tmp/dashboard.html");
  docker(
    "exec",
    container,
    "node",
    "--input-type=module",
    "-e",
    String.raw`import assert from 'node:assert/strict';
     import fs from 'node:fs/promises';
     const html = await fs.readFile('/tmp/dashboard.html', 'utf8');
     assert.ok(Buffer.byteLength(html) > 6_000_000);
     assert.match(html, /<html[\s>]/);
     const files = await fs.readdir('/tmp');
     assert.ok(!files.some(name => /^dashivo-(dashboard|build|pyodide)-/.test(name)));
     console.log('Standalone HTML generated and temporary sources cleaned:', Buffer.byteLength(html));`,
  );
} finally {
  docker("logs", container);
  docker("rm", "--force", container);
}
