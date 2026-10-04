import { App, Tags } from "aws-cdk-lib";
import configuration from "@dashivo/infra-cdk/configuration" with { type: "json" };
import { createWebStack } from "@dashivo/infra-cdk/stacks/web";

const app = new App();

createWebStack(app, "DashivoWeb", {
  ...configuration.deployment,
  env: { account: configuration.deployment.account, region: "us-east-1" },
  terminationProtection: true,
});

Tags.of(app).add("Application", "dashivo");
