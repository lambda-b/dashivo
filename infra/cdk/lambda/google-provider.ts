import {
  CognitoIdentityProviderClient,
  CreateIdentityProviderCommand,
  DeleteIdentityProviderCommand,
  UpdateIdentityProviderCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";

export interface GoogleProviderProperties {
  UserPoolId: string;
  ClientIdParameter: { name: string; version: number };
  ClientSecretParameter: { name: string; version: number };
}

const ssm = new SSMClient({});
const cognito = new CognitoIdentityProviderClient({});

export const handler = async (event: {
  RequestType: "Create" | "Update" | "Delete";
  ResourceProperties: GoogleProviderProperties;
}) => {
  const { UserPoolId, ClientIdParameter, ClientSecretParameter } = event.ResourceProperties;
  const identity = { UserPoolId, ProviderName: "Google" };

  try {
    if (event.RequestType === "Delete") {
      try {
        await cognito.send(new DeleteIdentityProviderCommand(identity));
      } catch (error) {
        if (!(error instanceof Error && error.name === "ResourceNotFoundException")) throw error;
      }
    } else {
      const { Parameters } = await ssm.send(
        new GetParametersCommand({
          Names: [ClientIdParameter, ClientSecretParameter].map(
            ({ name, version }) => `${name}:${version}`,
          ),
          WithDecryption: true,
        }),
      );
      const clientId = Parameters?.find(({ Name }) => Name === ClientIdParameter.name)?.Value;
      const secret = Parameters?.find(({ Name }) => Name === ClientSecretParameter.name);

      if (!clientId || !secret?.Value || secret.Type !== "SecureString") {
        throw new Error("Missing OAuth credentials or client secret is not SecureString.");
      }

      const settings = {
        ...identity,
        ProviderDetails: {
          client_id: clientId,
          client_secret: secret.Value,
          authorize_scopes: "openid email profile",
        },
        AttributeMapping: { email: "email" },
      };

      if (event.RequestType === "Create") {
        try {
          await cognito.send(
            new CreateIdentityProviderCommand({ ...settings, ProviderType: "Google" }),
          );
        } catch (error) {
          if (!(error instanceof Error && error.name === "DuplicateProviderException")) throw error;
          await cognito.send(new UpdateIdentityProviderCommand(settings));
        }
      } else {
        await cognito.send(new UpdateIdentityProviderCommand(settings));
      }
    }
  } catch {
    // SDK errors can include request details. Never expose credentials to deployment logs.
    throw new Error(
      `Google identity provider ${event.RequestType} failed. Check SSM parameters and permissions.`,
    );
  }

  return { PhysicalResourceId: `${UserPoolId}/Google` };
};
