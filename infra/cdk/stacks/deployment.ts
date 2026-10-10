import { CfnOutput, CfnParameter, Duration, Stack, type App, type StackProps } from "aws-cdk-lib";
import {
  FederatedPrincipal,
  OpenIdConnectProvider,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam";

interface DeploymentStackProps extends StackProps {
  readonly oidcSubject: string;
}

export const createDeploymentStack = (app: App, id: string, props: DeploymentStackProps) => {
  const stack = new Stack(app, id, props);
  const websiteBucket = new CfnParameter(stack, "WebsiteBucketName", {
    type: "String",
    allowedPattern: "[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]",
  });
  const distributionId = new CfnParameter(stack, "DistributionId", {
    type: "String",
    allowedPattern: "[A-Z0-9]+",
  });
  // This account already has a shared GitHub provider; do not create or take ownership of it.
  const provider = OpenIdConnectProvider.fromOpenIdConnectProviderArn(
    stack,
    "GitHub",
    `arn:${stack.partition}:iam::${stack.account}:oidc-provider/token.actions.githubusercontent.com`,
  );
  const role = new Role(stack, "DeployRole", {
    roleName: "DashivoGitHubDeploy",
    maxSessionDuration: Duration.hours(1),
    assumedBy: new FederatedPrincipal(
      provider.openIdConnectProviderArn,
      {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": props.oidcSubject,
        },
      },
      "sts:AssumeRoleWithWebIdentity",
    ),
  });

  role.addToPolicy(
    new PolicyStatement({
      actions: ["sts:AssumeRole"],
      resources: ["us-east-1", "ap-northeast-1"].flatMap((region) =>
        ["deploy", "file-publishing", "image-publishing"].map(
          (purpose) =>
            `arn:${stack.partition}:iam::${stack.account}:role/cdk-hnb659fds-${purpose}-role-${stack.account}-${region}`,
        ),
      ),
    }),
  );
  role.addToPolicy(
    new PolicyStatement({
      actions: ["cloudformation:DescribeStacks"],
      resources: [
        ["us-east-1", "DashivoWeb"],
        ["ap-northeast-1", "DashivoIdentity"],
        ["ap-northeast-1", "DashivoStorage"],
        ["ap-northeast-1", "DashivoApi"],
      ].map(
        ([region, name]) =>
          `arn:${stack.partition}:cloudformation:${region}:${stack.account}:stack/${name}/*`,
      ),
    }),
  );
  role.addToPolicy(
    new PolicyStatement({
      actions: ["s3:ListBucket"],
      resources: [`arn:${stack.partition}:s3:::${websiteBucket.valueAsString}`],
    }),
  );
  role.addToPolicy(
    new PolicyStatement({
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: [`arn:${stack.partition}:s3:::${websiteBucket.valueAsString}/*`],
    }),
  );
  role.addToPolicy(
    new PolicyStatement({
      actions: ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
      resources: [
        `arn:${stack.partition}:cloudfront::${stack.account}:distribution/${distributionId.valueAsString}`,
      ],
    }),
  );

  new CfnOutput(stack, "DeployRoleArn", { value: role.roleArn });
  return stack;
};
