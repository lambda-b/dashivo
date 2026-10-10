import { fileURLToPath } from "node:url";
import {
  CfnOutput,
  CfnParameter,
  Duration,
  IgnoreMode,
  Stack,
  type App,
  type StackProps,
} from "aws-cdk-lib";
import type { ITableV2 } from "aws-cdk-lib/aws-dynamodb";
import type { IBucket } from "aws-cdk-lib/aws-s3";
import { Role, ServicePrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  Architecture,
  DockerImageCode,
  DockerImageFunction,
  FunctionUrlAuthType,
} from "aws-cdk-lib/aws-lambda";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

interface ApiStackProps extends StackProps {
  readonly table: ITableV2;
  readonly assets: IBucket;
  readonly downloads: IBucket;
}

export const createApiStack = (app: App, id: string, props: ApiStackProps) => {
  const stack = new Stack(app, id, props);
  const userPoolId = new CfnParameter(stack, "UserPoolId", {
    type: "String",
    allowedPattern: "ap-northeast-1_[A-Za-z0-9]+",
  });
  const clientId = new CfnParameter(stack, "UserPoolClientId", {
    type: "String",
    allowedPattern: "[a-z0-9]+",
  });
  const distributionId = new CfnParameter(stack, "DistributionId", {
    type: "String",
    allowedPattern: "[A-Z0-9]+",
  });
  const role = new Role(stack, "ExecutionRole", {
    assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
  });
  const logs = new LogGroup(stack, "ApiLogs", { retention: RetentionDays.TWO_WEEKS });
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const fn = new DockerImageFunction(stack, "Handler", {
    code: DockerImageCode.fromImageAsset(root, {
      file: "infra/cdk/lambda/Dockerfile",
      platform: Platform.LINUX_ARM64,
      ignoreMode: IgnoreMode.DOCKER,
    }),
    architecture: Architecture.ARM_64,
    memorySize: 2048,
    timeout: Duration.seconds(60),
    logGroup: logs,
    role,
    environment: {
      DASHBOARD_TABLE: props.table.tableName,
      ASSETS_BUCKET: props.assets.bucketName,
      DOWNLOADS_BUCKET: props.downloads.bucketName,
      EXPORT_SOURCE_ROOT: "/var/task",
      COGNITO_USER_POOL_ID: userPoolId.valueAsString,
      COGNITO_CLIENT_ID: clientId.valueAsString,
    },
  });

  logs.grantWrite(fn);
  props.table.grant(
    fn,
    "dynamodb:GetItem",
    "dynamodb:Query",
    "dynamodb:PutItem",
    "dynamodb:DeleteItem",
    "dynamodb:ConditionCheckItem",
  );
  fn.addToRolePolicy(
    new PolicyStatement({
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: [props.assets.arnForObjects("users/*/dashboards/*/csv/*")],
    }),
  );
  fn.addToRolePolicy(
    new PolicyStatement({
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: [props.downloads.arnForObjects("users/*/dashboards/*/*.html")],
    }),
  );
  const url = fn.addFunctionUrl({ authType: FunctionUrlAuthType.AWS_IAM });
  const sourceArn = `arn:${stack.partition}:cloudfront::${stack.account}:distribution/${distributionId.valueAsString}`;
  fn.addPermission("CloudFrontUrl", {
    principal: new ServicePrincipal("cloudfront.amazonaws.com"),
    action: "lambda:InvokeFunctionUrl",
    functionUrlAuthType: FunctionUrlAuthType.AWS_IAM,
    sourceArn,
    sourceAccount: stack.account,
  });
  fn.addPermission("CloudFrontInvoke", {
    principal: new ServicePrincipal("cloudfront.amazonaws.com"),
    action: "lambda:InvokeFunction",
    invokedViaFunctionUrl: true,
    sourceArn,
    sourceAccount: stack.account,
  });

  new CfnOutput(stack, "ApiUrl", { value: url.url });
  new CfnOutput(stack, "FunctionName", { value: fn.functionName });

  return stack;
};
