import { HTTPException } from "hono/http-exception";

interface RequestSchema<Output> {
  safeParse(
    value: unknown,
  ): { success: true; data: Output } | { success: false; error: { message: string } };
}

export const parseJsonBody = async <Output>(
  request: Request,
  schema: RequestSchema<Output>,
): Promise<Output> => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new HTTPException(400, { message: "リクエストボディがJSONではありません。" });
  }

  const result = schema.safeParse(body);
  if (!result.success) throw new HTTPException(400, { message: result.error.message });

  return result.data;
};

export const parseQuery = <Output>(query: unknown, schema: RequestSchema<Output>): Output => {
  const result = schema.safeParse(query);
  if (!result.success) throw new HTTPException(400, { message: result.error.message });

  return result.data;
};
