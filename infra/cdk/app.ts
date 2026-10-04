import { App, Tags } from "aws-cdk-lib";
import configuration from "@dashivo/infra-cdk/configuration" with { type: "json" };
import { createWebStack } from "@dashivo/infra-cdk/stacks/web";
import { createIdentityStack } from "@dashivo/infra-cdk/stacks/identity";

const app = new App();
const googleClientId = app.node.tryGetContext("googleClientId") as string | undefined;
const googleSecretArn = app.node.tryGetContext("googleSecretArn") as string | undefined;
if (Boolean(googleClientId) !== Boolean(googleSecretArn)) {
  throw new Error("Google client ID and Secret ARN must be configured together.");
}

createWebStack(app, "DashivoWeb", {
  ...configuration.deployment,
  env: { account: configuration.deployment.account, region: "us-east-1" },
  terminationProtection: true,
});

createIdentityStack(app, "DashivoIdentity", {
  domainName: configuration.deployment.domainName,
  env: { account: configuration.deployment.account, region: "ap-northeast-1" },
  terminationProtection: true,
  google:
    googleClientId && googleSecretArn
      ? { clientId: googleClientId, secretArn: googleSecretArn }
      : undefined,
});

Tags.of(app).add("Application", "dashivo");
