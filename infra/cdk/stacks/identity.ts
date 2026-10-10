import { fileURLToPath } from "node:url";
import {
  CfnOutput,
  CustomResource,
  Duration,
  RemovalPolicy,
  Stack,
  type App,
  type StackProps,
} from "aws-cdk-lib";
import {
  FeaturePlan,
  ManagedLoginVersion,
  Mfa,
  OAuthScope,
  UserPool,
  UserPoolClientIdentityProvider,
} from "aws-cdk-lib/aws-cognito";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Provider } from "aws-cdk-lib/custom-resources";
import type { GoogleProviderProperties } from "@dashivo/infra-cdk/lambda/google-provider";

interface IdentityStackProps extends StackProps {
  readonly domainName: string;
  readonly google?: {
    readonly clientIdParameter: GoogleProviderProperties["ClientIdParameter"];
    readonly clientSecretParameter: GoogleProviderProperties["ClientSecretParameter"];
  };
}

export const createIdentityStack = (app: App, id: string, props: IdentityStackProps) => {
  const stack = new Stack(app, id, props);
  const pool = new UserPool(stack, "UserPool", {
    featurePlan: FeaturePlan.ESSENTIALS,
    selfSignUpEnabled: false,
    signInAliases: { email: true },
    autoVerify: { email: true },
    standardAttributes: { email: { required: true, mutable: true } },
    passwordPolicy: {
      minLength: 12,
      requireDigits: true,
      requireLowercase: true,
      requireUppercase: true,
      requireSymbols: true,
    },
    mfa: Mfa.OPTIONAL,
    mfaSecondFactor: { sms: false, otp: true },
    deletionProtection: true,
    removalPolicy: RemovalPolicy.RETAIN,
  });
  let google: CustomResource | undefined;

  if (props.google) {
    const handler = new NodejsFunction(stack, "GoogleHandler", {
      entry: fileURLToPath(new URL("../lambda/google-provider.ts", import.meta.url)),
      runtime: Runtime.NODEJS_24_X,
      handler: "handler",
      timeout: Duration.seconds(30),
      bundling: { externalModules: [] },
      logGroup: new LogGroup(stack, "GoogleLogs", { retention: RetentionDays.TWO_WEEKS }),
    });
    handler.addToRolePolicy(
      new PolicyStatement({
        actions: ["ssm:GetParameters"],
        resources: [props.google.clientIdParameter, props.google.clientSecretParameter].map(
          ({ name }) =>
            stack.formatArn({ service: "ssm", resource: "parameter", resourceName: name.slice(1) }),
        ),
      }),
    );
    handler.addToRolePolicy(
      new PolicyStatement({
        actions: [
          "cognito-idp:CreateIdentityProvider",
          "cognito-idp:UpdateIdentityProvider",
          "cognito-idp:DeleteIdentityProvider",
        ],
        resources: [pool.userPoolArn],
      }),
    );

    const provider = new Provider(stack, "GoogleProvider", { onEventHandler: handler });
    google = new CustomResource(stack, "Google", {
      serviceToken: provider.serviceToken,
      resourceType: "Custom::GoogleIdentityProvider",
      properties: {
        UserPoolId: pool.userPoolId,
        ClientIdParameter: props.google.clientIdParameter,
        ClientSecretParameter: props.google.clientSecretParameter,
      } satisfies GoogleProviderProperties,
    });
  }

  const client = pool.addClient("WebClient", {
    generateSecret: false,
    authFlows: { userSrp: true },
    preventUserExistenceErrors: true,
    enableTokenRevocation: true,
    accessTokenValidity: Duration.minutes(10),
    idTokenValidity: Duration.minutes(10),
    refreshTokenValidity: Duration.days(1),
    refreshTokenRotationGracePeriod: Duration.seconds(10),
    supportedIdentityProviders: google
      ? [UserPoolClientIdentityProvider.GOOGLE]
      : [UserPoolClientIdentityProvider.COGNITO],
    oAuth: {
      flows: { authorizationCodeGrant: true },
      scopes: [OAuthScope.OPENID, OAuthScope.EMAIL],
      callbackUrls: [`https://${props.domainName}/`],
      logoutUrls: [`https://${props.domainName}/`],
    },
  });
  if (google) client.node.addDependency(google);

  // Keep the classic hosted UI while Essentials enables refresh token rotation.
  const domain = pool.addDomain("Domain", {
    cognitoDomain: { domainPrefix: `dashivo-${stack.account}` },
    managedLoginVersion: ManagedLoginVersion.CLASSIC_HOSTED_UI,
  });

  new CfnOutput(stack, "UserPoolId", { value: pool.userPoolId });
  new CfnOutput(stack, "UserPoolClientId", { value: client.userPoolClientId });
  new CfnOutput(stack, "LoginDomain", { value: domain.baseUrl() });
  new CfnOutput(stack, "GoogleRedirectUri", { value: `${domain.baseUrl()}/oauth2/idpresponse` });

  return stack;
};
