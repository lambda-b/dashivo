import path from "node:path";
import { fileURLToPath } from "node:url";
import { CfnOutput, CfnParameter, Duration, Stack, type App, type StackProps } from "aws-cdk-lib";
import type { ITableV2 } from "aws-cdk-lib/aws-dynamodb";
import type { IBucket } from "aws-cdk-lib/aws-s3";
import { Role, ServicePrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Architecture, FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

interface ApiStackProps extends StackProps {
  readonly table: ITableV2;
  readonly assets: IBucket;
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
  const fn = new NodejsFunction(stack, "Handler", {
    entry: path.join(root, "infra/cdk/lambda/handler.ts"),
    depsLockFilePath: path.join(root, "pnpm-lock.yaml"),
    projectRoot: root,
    handler: "handler",
    runtime: Runtime.NODEJS_24_X,
    architecture: Architecture.ARM_64,
    memorySize: 512,
    timeout: Duration.seconds(30),
    logGroup: logs,
    role,
    environment: {
      DASHBOARD_TABLE: props.table.tableName,
      ASSETS_BUCKET: props.assets.bucketName,
      COGNITO_USER_POOL_ID: userPoolId.valueAsString,
      COGNITO_CLIENT_ID: clientId.valueAsString,
    },
    bundling: {
      format: OutputFormat.CJS,
      minify: true,
      externalModules: [],
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
