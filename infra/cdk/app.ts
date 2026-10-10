import { App, Tags } from "aws-cdk-lib";
import configuration from "@dashivo/infra-cdk/configuration" with { type: "json" };
import { createWebStack } from "@dashivo/infra-cdk/stacks/web";
import { createIdentityStack } from "@dashivo/infra-cdk/stacks/identity";
import { createStorageStack } from "@dashivo/infra-cdk/stacks/storage";
import { createApiStack } from "@dashivo/infra-cdk/stacks/api";

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
  apiOriginDomain: app.node.tryGetContext("apiOriginDomain") as string | undefined,
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

const storage = createStorageStack(app, "DashivoStorage", {
  env: { account: configuration.deployment.account, region: "ap-northeast-1" },
  terminationProtection: true,
});

createApiStack(app, "DashivoApi", {
  env: { account: configuration.deployment.account, region: "ap-northeast-1" },
  terminationProtection: true,
  table: storage.table,
  assets: storage.assets,
});

Tags.of(app).add("Application", "dashivo");
