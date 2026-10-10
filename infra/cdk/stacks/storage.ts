import { CfnOutput, Duration, RemovalPolicy, Stack, type App, type StackProps } from "aws-cdk-lib";
import { AttributeType, Billing, TableEncryptionV2, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { BlockPublicAccess, Bucket, BucketEncryption, ObjectOwnership } from "aws-cdk-lib/aws-s3";

export const createStorageStack = (app: App, id: string, props: StackProps) => {
  const stack = new Stack(app, id, props);
  const table = new TableV2(stack, "Dashboards", {
    partitionKey: { name: "pk", type: AttributeType.STRING },
    sortKey: { name: "sk", type: AttributeType.STRING },
    billing: Billing.onDemand(),
    encryption: TableEncryptionV2.dynamoOwnedKey(),
    deletionProtection: true,
    removalPolicy: RemovalPolicy.RETAIN,
    pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: false },
  });

  const logs = new Bucket(stack, "AccessLogs", {
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
    lifecycleRules: [{ expiration: Duration.days(14) }],
    removalPolicy: RemovalPolicy.RETAIN,
  });
  const assets = new Bucket(stack, "Assets", {
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
    serverAccessLogsBucket: logs,
    serverAccessLogsPrefix: "assets/",
    lifecycleRules: [{ abortIncompleteMultipartUploadAfter: Duration.days(1) }],
    removalPolicy: RemovalPolicy.RETAIN,
  });
  const downloads = new Bucket(stack, "Downloads", {
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
    serverAccessLogsBucket: logs,
    serverAccessLogsPrefix: "downloads/",
    lifecycleRules: [
      { expiration: Duration.days(1), abortIncompleteMultipartUploadAfter: Duration.days(1) },
    ],
    removalPolicy: RemovalPolicy.RETAIN,
  });

  new CfnOutput(stack, "DashboardTableName", { value: table.tableName });
  new CfnOutput(stack, "AssetsBucketName", { value: assets.bucketName });
  new CfnOutput(stack, "DownloadsBucketName", { value: downloads.bucketName });

  return { stack, table, assets, downloads };
};
