import { expect, test } from "@playwright/test";
import { mockClient } from "aws-sdk-client-mock";
import {
  CognitoIdentityProviderClient,
  CreateIdentityProviderCommand,
  DeleteIdentityProviderCommand,
  UpdateIdentityProviderCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";
import { handler, type GoogleProviderProperties } from "@dashivo/infra-cdk/lambda/google-provider";

const ssm = mockClient(SSMClient);
const cognito = mockClient(CognitoIdentityProviderClient);
const properties: GoogleProviderProperties = {
  UserPoolId: "ap-northeast-1_test",
  ClientIdParameter: { name: "/test/google/client-id", version: 2 },
  ClientSecretParameter: { name: "/test/google/client-secret", version: 1 },
};
const parameters = [
  { Name: properties.ClientIdParameter.name, Value: "test-client-id", Type: "String" as const },
  {
    Name: properties.ClientSecretParameter.name,
    Value: "test-secret",
    Type: "SecureString" as const,
  },
];

test.beforeEach(() => {
  ssm.reset();
  cognito.reset();
  ssm.on(GetParametersCommand).resolves({ Parameters: parameters });
  cognito.resolves({});
});

test.afterAll(() => {
  ssm.restore();
  cognito.restore();
});

test("creates Google from pinned SSM values without returning credentials", async () => {
  const response = await handler({ RequestType: "Create", ResourceProperties: properties });

  expect(response).toEqual({ PhysicalResourceId: "ap-northeast-1_test/Google" });
  expect(ssm.commandCalls(GetParametersCommand)[0].args[0].input).toEqual({
    Names: ["/test/google/client-id:2", "/test/google/client-secret:1"],
    WithDecryption: true,
  });
  expect(cognito.commandCalls(CreateIdentityProviderCommand)[0].args[0].input).toEqual({
    UserPoolId: properties.UserPoolId,
    ProviderName: "Google",
    ProviderType: "Google",
    ProviderDetails: {
      client_id: "test-client-id",
      client_secret: "test-secret",
      authorize_scopes: "openid email profile",
    },
    AttributeMapping: { email: "email" },
  });
});

test("updates credentials and supports retry after provider creation", async () => {
  await handler({ RequestType: "Update", ResourceProperties: properties });
  expect(cognito.commandCalls(UpdateIdentityProviderCommand)).toHaveLength(1);

  cognito.on(CreateIdentityProviderCommand).rejects({ name: "DuplicateProviderException" });
  await handler({ RequestType: "Create", ResourceProperties: properties });
  expect(cognito.commandCalls(UpdateIdentityProviderCommand)).toHaveLength(2);
});

test("delete is idempotent and does not require SSM credentials", async () => {
  cognito.on(DeleteIdentityProviderCommand).rejects({ name: "ResourceNotFoundException" });

  await handler({ RequestType: "Delete", ResourceProperties: properties });
  expect(ssm.calls()).toHaveLength(0);
  expect(cognito.commandCalls(DeleteIdentityProviderCommand)[0].args[0].input).toEqual({
    UserPoolId: properties.UserPoolId,
    ProviderName: "Google",
  });
});

test("rejects missing parameters and secrets stored as String", async () => {
  for (const Parameters of [
    [],
    [parameters[0]],
    [parameters[0], { ...parameters[1], Type: "String" as const }],
  ]) {
    ssm.on(GetParametersCommand).resolves({ Parameters });
    await expect(
      handler({ RequestType: "Create", ResourceProperties: properties }),
    ).rejects.toThrow("Google identity provider Create failed");
  }
  expect(cognito.calls()).toHaveLength(0);
});

test("SDK errors never leak credential values in deployment failures", async () => {
  cognito.on(CreateIdentityProviderCommand).rejects(new Error("request client_secret=test-secret"));

  await expect(handler({ RequestType: "Create", ResourceProperties: properties })).rejects.toThrow(
    "Google identity provider Create failed. Check SSM parameters and permissions.",
  );
  expect(cognito.commandCalls(UpdateIdentityProviderCommand)).toHaveLength(0);
});
