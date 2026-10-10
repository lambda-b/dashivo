import path from "node:path";
import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { build, preview, type PreviewServer } from "vite";
import { createEditorViteConfiguration } from "@dashivo/shared-vite/editor";
import { createEmptyDashboard } from "@dashivo/shared-schema/dashboard";
import sample from "@/sample/dashboard.json" with { type: "json" };
import type { DashboardRegistration } from "@dashivo/shared-schema/api";

const origin = "http://127.0.0.1:3130";
const loginOrigin = "https://dashivo-test.auth.ap-northeast-1.amazoncognito.com";
const clientId = "test-client";
let server: PreviewServer;

test.beforeAll(async () => {
  const outDir = path.resolve("tests/results/online-editor");
  await build({
    ...createEditorViteConfiguration(path.resolve(".")),
    configFile: false,
    mode: "editor",
    logLevel: "silent",
    define: {
      "import.meta.env.VITE_COGNITO_USER_POOL_ID": JSON.stringify("ap-northeast-1_Test"),
      "import.meta.env.VITE_COGNITO_CLIENT_ID": JSON.stringify(clientId),
      "import.meta.env.VITE_COGNITO_LOGIN_URL": JSON.stringify(loginOrigin),
    },
    build: { outDir, emptyOutDir: true },
  });
  server = await preview({
    configFile: false,
    root: path.resolve("app/client"),
    build: { outDir },
    preview: { host: "127.0.0.1", port: 3130, strictPort: true },
  });
});

test.afterAll(async () => {
  await server?.close();
});

const token = (userId: string, tokenUse: string) => {
  const payload = {
    sub: userId,
    username: userId,
    email: `${userId}@example.com`,
    token_use: tokenUse,
    client_id: clientId,
    aud: clientId,
    iss: "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_Test",
    exp: Math.floor(Date.now() / 1000) + 600,
    iat: Math.floor(Date.now() / 1000),
  };
  // SDKのブラウザー動作だけを検証する。実署名の検証はauthentication.spec.tsで行う。
  return `${Buffer.from(JSON.stringify({ alg: "RS256", kid: "test" })).toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.test-signature`;
};

const mockLogin = async (page: Page, invalidState = false) => {
  const accessToken = token("user-a", "access");
  const exchanges: URLSearchParams[] = [];
  const refreshes: { ClientId: string; RefreshToken: string }[] = [];
  const authorizations: URL[] = [];
  await page.route(`${loginOrigin}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/oauth2/authorize") {
      authorizations.push(url);
      const callback = new URL(url.searchParams.get("redirect_uri")!);
      callback.searchParams.set("code", "test-code");
      callback.searchParams.set(
        "state",
        invalidState ? "invalid-state" : url.searchParams.get("state")!,
      );
      return route.fulfill({ status: 302, headers: { location: callback.href } });
    }
    if (url.pathname === "/oauth2/token") {
      exchanges.push(new URLSearchParams(route.request().postData()!));
      return route.fulfill({
        headers: { "access-control-allow-origin": "*" },
        json: {
          access_token: accessToken,
          id_token: token("user-a", "id"),
          refresh_token: "test-refresh-token",
          expires_in: 600,
          token_type: "Bearer",
        },
      });
    }
    if (url.pathname === "/logout")
      return route.fulfill({ status: 302, headers: { location: `${origin}/` } });
    return route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: {} });
  });
  await page.route("https://cognito-idp.ap-northeast-1.amazonaws.com/**", (route) => {
    const refreshing = route
      .request()
      .headers()
      ["x-amz-target"]?.endsWith("GetTokensFromRefreshToken");
    if (refreshing) refreshes.push(route.request().postDataJSON());
    return route.fulfill({
      json: refreshing
        ? {
            AuthenticationResult: {
              AccessToken: accessToken,
              IdToken: token("user-a", "id"),
              RefreshToken: "rotated-refresh-token",
              ExpiresIn: 600,
              TokenType: "Bearer",
            },
          }
        : {},
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });
  });
  return { exchanges, authorizations, accessToken, refreshes };
};

test("guest editing persists JSON, CSV and Python without API access or HTML download", async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(`${origin}/api/**`, (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await page.goto(origin);
  await expect(page.getByLabel("新しいダッシュボード")).toHaveCount(0);
  await expect(page.getByLabel("開発用: 認証済み")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: sample.dashboard.title, exact: true }),
  ).toBeVisible();
  await expect(page.locator("header").getByText("サンプル", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#\/d\/trial\/summary$/);
  await expect(page.getByRole("navigation", { name: "ダッシュボード一覧" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ダッシュボード一覧を開く" })).toHaveCount(0);
  await expect
    .poll(() => page.locator("main").evaluate((element) => element.getBoundingClientRect().left))
    .toBe(0);
  const dashboardUrl = page.url();
  await expect(page.getByText("￥754,000", { exact: true })).toBeVisible();
  await page.getByLabel("開始日", { exact: true }).fill("2026-02-01");
  await page.getByLabel("終了日", { exact: true }).fill("2026-02-01");
  await expect(page.getByText("￥251,000", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "East", exact: true }).check();
  await expect(page.getByText("￥141,000", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "HTMLをダウンロード" })).toHaveCount(0);
  await expect(page.getByText(/ログインが必要です|オフライン実行中/)).toHaveCount(0);

  await page.getByRole("button", { name: "Pythonロジックを管理" }).click();
  await page.getByLabel("アップロードするCSVファイル").setInputFiles({
    name: "values.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("value\n12\n17\n"),
  });
  await expect(page.getByRole("list", { name: "入力CSV一覧" })).toContainText("input-2");
  await page.getByRole("button", { name: "ロジックを追加", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "作成", exact: true }).click();
  const editor = page.locator(".cm-content");
  await expect(page).toHaveURL(/\/builder\/python\/logic-1$/);
  await expect(editor).toContainText("新しい数値");
  await editor.fill(`from dashivo import plot

def execute(inputs, params):
    fig = plot.metric(inputs["input-2"]["value"].sum())
    fig.title("Guest result")
    return fig
`);
  await page.getByRole("button", { name: "Pythonを保存" }).click();
  await expect(page.getByRole("button", { name: "Pythonを保存" })).toBeDisabled();
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(page.getByRole("article").getByText("Guest result", { exact: true })).toBeVisible();
  await expect(page.getByRole("article").getByText("29", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dashboardへ戻る" }).click();

  await page.getByRole("button", { name: "サマリーにコンテンツを追加" }).click();
  await page.getByRole("dialog").getByText("logic-1", { exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "コンテンツを追加" }).click();
  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await page.getByLabel("タイトル").fill("Saved guest dashboard");
  await page.getByRole("button", { name: "dashboard.jsonを保存" }).click();
  await expect(page.getByText("保存しました", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved guest dashboard", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("article").getByText("29", { exact: true })).toBeVisible();
  expect(page.url()).toBe(dashboardUrl);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("login registers edited trial revisions once and logout restores the trial", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockLogin(page);
  const dashboard = createEmptyDashboard("Account dashboard");
  const registrations: DashboardRegistration[] = [];
  await page.route(`${origin}/api/dashboards**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/dashboards/registrations") {
      const registration = route.request().postDataJSON() as DashboardRegistration;
      registrations.push(registration);
      return route.fulfill({
        json: {
          dashboard: {
            id: `draft-${registration.revisionId}`,
            title: registration.dashboard.title,
            updatedAt: "2026-10-10",
          },
        },
      });
    }
    const registered = registrations.at(-1);
    if (path.endsWith("/sources/python") || path.endsWith("/sources/csv")) {
      const sourcePath = new URL(route.request().url()).searchParams.get("path")!;
      return route.fulfill({ json: { source: registered?.sources[sourcePath] } });
    }
    return route.fulfill({
      json:
        path === "/api/dashboards"
          ? {
              dashboards: [
                ...registrations.map((entry) => ({
                  id: `draft-${entry.revisionId}`,
                  title: entry.dashboard.title,
                  updatedAt: "2026-10-10",
                })),
                { id: "account", title: dashboard.title, updatedAt: "2026-10-08" },
              ],
            }
          : { dashboard: registered?.dashboard ?? dashboard },
    });
  });
  await page.goto(origin);
  const editTitle = async (title: string) => {
    await page.getByRole("button", { name: "ヘッダーを編集" }).click();
    await page.getByLabel("タイトル").fill(title);
    await page.getByRole("button", { name: "dashboard.jsonを保存" }).click();
    await expect(page.getByText("保存しました", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Builderを閉じる" }).click();
  };
  await editTitle("Browser draft");
  await expect(page.getByRole("heading", { name: "Browser draft", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page.getByLabel("新しいダッシュボード")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Browser draft", exact: true })).toBeVisible();
  expect(registrations).toHaveLength(1);
  await expect(page.getByRole("button", { name: "HTMLをダウンロード" })).toBeEnabled();
  await page.getByRole("button", { name: "ログアウト", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Browser draft", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "ダッシュボード一覧" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "HTMLをダウンロード" })).toHaveCount(0);
  await expect(page.getByText("試用", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page.getByLabel("新しいダッシュボード")).toBeVisible();
  expect(registrations).toHaveLength(1);
  await page.getByRole("button", { name: "ログアウト", exact: true }).click();
  await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible();
  await editTitle("Another revision");
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Another revision", exact: true })).toBeVisible();
  expect(registrations).toHaveLength(2);
  expect(registrations[0].revisionId).not.toBe(registrations[1].revisionId);
  expect(errors).toEqual([]);
});

test("login uses PKCE, gates API access and clears session tokens on logout", async ({ page }) => {
  const { exchanges, authorizations, accessToken } = await mockLogin(page);
  const apiRequests: string[] = [];
  await page.route(`${origin}/api/dashboards`, (route) => {
    apiRequests.push(route.request().headers()["x-dashivo-token"]);
    return route.fulfill({ json: { dashboards: [] } });
  });
  await page.goto(origin);
  await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);
  await expect(page.getByText("Sale-pulse")).toHaveCount(0);

  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page.getByText("user-a@example.com")).toBeVisible();
  await expect(page.getByLabel("新しいダッシュボード")).toBeVisible();
  expect(authorizations[0].searchParams.get("response_type")).toBe("code");
  expect(authorizations[0].searchParams.get("code_challenge_method")).toBe("S256");
  expect(authorizations[0].searchParams.get("code_challenge")).toBeTruthy();
  expect(authorizations[0].searchParams.get("client_secret")).toBeNull();
  expect(exchanges[0].get("code_verifier")).toBeTruthy();
  expect(createHash("sha256").update(exchanges[0].get("code_verifier")!).digest("base64url")).toBe(
    authorizations[0].searchParams.get("code_challenge"),
  );
  expect(exchanges[0].get("grant_type")).toBe("authorization_code");
  expect(apiRequests).toEqual([accessToken]);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => /\.(accessToken|idToken|refreshToken)$/.test(key)),
    ),
  ).toEqual([]);

  await page.getByRole("button", { name: "ログアウト", exact: true }).click();
  await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible();
  await expect(page.getByText("user-a@example.com")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) =>
        /\.(accessToken|idToken|refreshToken)$/.test(key),
      ),
    ),
  ).toEqual([]);
});

test("rejects an OAuth callback with a different state without exchanging tokens", async ({
  page,
}) => {
  const { exchanges } = await mockLogin(page, true);
  await page.goto(origin);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible();
  await expect(page.getByText("ログインできませんでした。もう一度お試しください。")).toBeVisible();
  expect(exchanges).toEqual([]);
});

test("production editor executes the authenticated CSV and Python rather than embedded data", async ({
  page,
}) => {
  const { accessToken } = await mockLogin(page);
  const dashboard = createEmptyDashboard("Online dashboard");
  dashboard.analysis = {
    inputs: [{ id: "numbers", type: "csv", path: "data/numbers.csv" }],
    logic: [{ id: "total", type: "python", path: "logic/total.py" }],
  };
  dashboard.tabs[0].contents = [{ id: "metric", logic: "total" }];
  const requests: string[] = [];
  await page.route(`${origin}/api/dashboards**`, (route) => {
    expect(route.request().headers()["x-dashivo-token"]).toBe(accessToken);
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    if (url.pathname.endsWith("/sources/csv"))
      return route.fulfill({ json: { source: "value\n11\n31\n" } });
    if (url.pathname.endsWith("/sources/python"))
      return route.fulfill({
        json: {
          source:
            "from dashivo import plot\n\ndef execute(inputs, params):\n    fig = plot.metric(inputs['numbers']['value'].sum())\n    fig.title('Online result')\n    return fig\n",
        },
      });
    if (url.pathname === "/api/dashboards")
      return route.fulfill({
        json: { dashboards: [{ id: "online", title: dashboard.title, updatedAt: "2026-10-05" }] },
      });
    return route.fulfill({ json: { dashboard } });
  });

  await page.goto(origin);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page.getByText("Online result", { exact: true })).toBeVisible();
  await expect(page.getByText("42", { exact: true })).toBeVisible();
  expect(requests).toContain("/api/dashboards/online/sources/csv");
  expect(requests).toContain("/api/dashboards/online/sources/python");
});

const expireSession = (page: Page) =>
  page.evaluate(() => {
    for (const key of Object.keys(sessionStorage).filter((key) =>
      /\.(accessToken|idToken)$/.test(key),
    )) {
      const [header, payload, signature] = sessionStorage.getItem(key)!.split(".");
      const expired = btoa(JSON.stringify({ ...JSON.parse(atob(payload)), exp: 1 })).replace(
        /=/g,
        "",
      );
      sessionStorage.setItem(key, `${header}.${expired}.${signature}`);
    }
  });

test("expired tokens refresh and rotate before saving a dashboard", async ({ page }) => {
  const { refreshes, accessToken } = await mockLogin(page);
  await page.route(`${origin}/api/dashboards`, (route) => {
    if (route.request().method() === "POST") {
      expect(route.request().headers()["x-dashivo-token"]).toBe(accessToken);
      expect(route.request().headers()["x-amz-content-sha256"]).toBe(
        createHash("sha256").update(route.request().postData()!).digest("hex"),
      );
      return route.fulfill({
        status: 201,
        json: { dashboard: { id: "created", title: "Created", updatedAt: "2026-10-05" } },
      });
    }
    return route.fulfill({ json: { dashboards: [] } });
  });
  await page.route(`${origin}/api/dashboards/created`, (route) =>
    route.fulfill({ json: { dashboard: createEmptyDashboard("Created") } }),
  );
  await page.goto(origin);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page.getByRole("button", { name: "ログアウト", exact: true })).toBeVisible();

  await expireSession(page);
  await page.getByLabel("新しいダッシュボード").fill("Created");
  await page.getByRole("button", { name: "作成", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Created", exact: true })).toBeVisible();
  expect(refreshes).toEqual([{ ClientId: clientId, RefreshToken: "test-refresh-token" }]);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("CognitoIdentityServiceProvider.test-client.user-a.refreshToken"),
    ),
  ).toBe("rotated-refresh-token");
});

for (const { name, signedOut } of [
  { name: "NotAuthorizedException", signedOut: true },
  { name: "InternalErrorException", signedOut: false },
]) {
  test(`session refresh failure distinguishes invalid credentials from service errors (${name})`, async ({
    page,
  }) => {
    await mockLogin(page);
    await page.route(`${origin}/api/dashboards`, (route) =>
      route.fulfill({ json: { dashboards: [] } }),
    );
    await page.goto(origin);
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
    await expect(page.getByRole("button", { name: "ログアウト", exact: true })).toBeVisible();

    await page.route("https://cognito-idp.ap-northeast-1.amazonaws.com/**", (route) =>
      route.fulfill({
        status: signedOut ? 400 : 500,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "POST, OPTIONS",
        },
        json: { __type: name, message: "Test refresh failure" },
      }),
    );
    await expireSession(page);
    await page.getByLabel("新しいダッシュボード").fill("Created");
    await page.getByRole("button", { name: "作成", exact: true }).click();

    if (signedOut) {
      await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible();
      await expect(page.getByText("user-a@example.com")).toHaveCount(0);
    } else {
      await expect(page.getByText("作成できませんでした。", { exact: true })).toBeVisible();
      await expect(page.getByText("user-a@example.com")).toBeVisible();
      await expect(page.getByRole("button", { name: "ログイン", exact: true })).toHaveCount(0);
      expect(
        await page.evaluate(() =>
          sessionStorage.getItem("CognitoIdentityServiceProvider.test-client.user-a.refreshToken"),
        ),
      ).toBe("test-refresh-token");
    }
  });
}
