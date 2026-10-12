import { App, Tags } from "aws-cdk-lib";
import configuration from "@dashivo/infra-cdk/configuration" with { type: "json" };
import { createWebStack } from "@dashivo/infra-cdk/stacks/web";
import { createIdentityStack } from "@dashivo/infra-cdk/stacks/identity";
import { createStorageStack } from "@dashivo/infra-cdk/stacks/storage";
import { createApiStack } from "@dashivo/infra-cdk/stacks/api";
import { createDeploymentStack } from "@dashivo/infra-cdk/stacks/deployment";
import { createBudgetStack } from "@dashivo/infra-cdk/stacks/budget";

const app = new App();
createBudgetStack(app, "DashivoBudget", {
  env: { account: configuration.deployment.account, region: "us-east-1" },
  terminationProtection: true,
});

createDeploymentStack(app, "DashivoDeployment", {
  env: { account: configuration.deployment.account, region: "ap-northeast-1" },
  terminationProtection: true,
  oidcSubject: `${configuration.github.oidcSubjectPrefix}:environment:${configuration.github.environment}`,
});

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
  google: configuration.google,
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
  downloads: storage.downloads,
});

Tags.of(app).add("Application", "dashivo");
