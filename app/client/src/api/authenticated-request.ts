export const prepareAuthenticatedRequest = async (
  request: Request,
  token: string,
  origin: string,
) => {
  const url = new URL(request.url);
  if (url.origin !== origin || !url.pathname.startsWith("/api/")) {
    throw new Error("Authenticated requests must target the same-origin API.");
  }

  request.headers.set("X-Dashivo-Token", token);

  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const digest = await crypto.subtle.digest("SHA-256", await request.clone().arrayBuffer());
    request.headers.set(
      "x-amz-content-sha256",
      Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    );
  }

  // 独自認証ヘッダーが外部のリダイレクト先へ転送されるのを防ぐ。
  return new Request(request, { redirect: "error" });
};
