import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  SecretValue,
  Stack,
  type App,
  type StackProps,
} from "aws-cdk-lib";
import {
  FeaturePlan,
  ManagedLoginVersion,
  Mfa,
  OAuthScope,
  ProviderAttribute,
  UserPool,
  UserPoolClientIdentityProvider,
  UserPoolIdentityProviderGoogle,
} from "aws-cdk-lib/aws-cognito";

interface IdentityStackProps extends StackProps {
  readonly domainName: string;
  readonly google?: { readonly clientId: string; readonly secretArn: string };
}

export const createIdentityStack = (app: App, id: string, props: IdentityStackProps) => {
  const stack = new Stack(app, id, props);
  const pool = new UserPool(stack, "UserPool", {
    featurePlan: FeaturePlan.LITE,
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
  const google =
    props.google &&
    new UserPoolIdentityProviderGoogle(stack, "Google", {
      userPool: pool,
      clientId: props.google.clientId,
      clientSecretValue: SecretValue.secretsManager(props.google.secretArn),
      scopes: ["openid", "email", "profile"],
      attributeMapping: { email: ProviderAttribute.GOOGLE_EMAIL },
    });
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

  // Classic hosted UI is available on the cost-focused Lite plan.
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
