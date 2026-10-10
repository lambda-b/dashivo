import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { createLambdaHandler } from "@dashivo/infra-cdk/lambda/app";
import { createCognitoAccessTokenVerifier } from "@dashivo/infra-cdk/auth/cognito";
import { createAwsDashboardRepository } from "@dashivo/infra-cdk/persistence/aws-dashboard-repository";

const environment = z
  .object({
    AWS_REGION: z.string().min(1),
    DASHBOARD_TABLE: z.string().min(1),
    ASSETS_BUCKET: z.string().min(1),
    COGNITO_USER_POOL_ID: z.string().min(1),
    COGNITO_CLIENT_ID: z.string().min(1),
  })
  .parse(process.env);

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: environment.AWS_REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({ region: environment.AWS_REGION });

export const handler = createLambdaHandler({
  verifyAccessToken: createCognitoAccessTokenVerifier(
    environment.COGNITO_USER_POOL_ID,
    environment.COGNITO_CLIENT_ID,
  ),
  repositoryForUser: (ownerId) =>
    createAwsDashboardRepository({
      ownerId,
      dynamo,
      s3,
      tableName: environment.DASHBOARD_TABLE,
      assetsBucket: environment.ASSETS_BUCKET,
    }),
  // The Vite exporter and S3 download delivery are connected in the next stage.
  dashboardHtmlBuilder: async () => {
    throw new HTTPException(501, { message: "HTMLダウンロードはまだ準備中です。" });
  },
});
