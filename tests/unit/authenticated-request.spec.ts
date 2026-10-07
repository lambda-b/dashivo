import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prepareAuthenticatedRequest } from "@/api/authenticated-request";

const origin = "https://dashivo.example.com";

test("only same-origin API requests receive the access token and redirects are blocked", async () => {
  const controller = new AbortController();
  const request = await prepareAuthenticatedRequest(
    new Request(`${origin}/api/dashboards`, { signal: controller.signal }),
    "access-token",
    origin,
  );

  expect(request.headers.get("X-Dashivo-Token")).toBe("access-token");
  expect(request.headers.has("x-amz-content-sha256")).toBe(false);
  expect(request.redirect).toBe("error");
  controller.abort();
  expect(request.signal.aborted).toBe(true);

  for (const target of ["https://other.example.com/api/dashboards", `${origin}/elsewhere`]) {
    await expect(prepareAuthenticatedRequest(new Request(target), "token", origin)).rejects.toThrow(
      "same-origin API",
    );
  }
});

test("hashes the exact JSON and CSV bytes without consuming the upload body", async () => {
  for (const body of [
    JSON.stringify({ title: "日本語" }),
    new File(["地域,売上\r\n東京,42\r\n"], "sales.csv"),
  ]) {
    const input = new Request(`${origin}/api/dashboards/example`, { method: "POST", body });
    const expected = createHash("sha256")
      .update(new Uint8Array(await input.clone().arrayBuffer()))
      .digest("hex");
    const request = await prepareAuthenticatedRequest(input, "token", origin);

    expect(request.headers.get("x-amz-content-sha256")).toBe(expected);
    expect(await request.text()).toBe(typeof body === "string" ? body : await body.text());
  }
});
