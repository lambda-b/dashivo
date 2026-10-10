import { expect, test } from "@playwright/test";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { createWebStack } from "@dashivo/infra-cdk/stacks/web";
import { createIdentityStack } from "@dashivo/infra-cdk/stacks/identity";
import { createStorageStack } from "@dashivo/infra-cdk/stacks/storage";
import configuration from "@dashivo/infra-cdk/configuration" with { type: "json" };

const storage = Template.fromStack(
  createStorageStack(new App({ context: configuration.context }), "StorageTest", {
    env: { account: "111111111111", region: "ap-northeast-1" },
    terminationProtection: true,
  }).stack,
);

test("dashboard storage uses a single-region on-demand table with retained user data", () => {
  storage.resourceCountIs("AWS::DynamoDB::GlobalTable", 1);
  storage.hasResourceProperties("AWS::DynamoDB::GlobalTable", {
    BillingMode: "PAY_PER_REQUEST",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
    ],
    SSESpecification: { SSEEnabled: false },
    Replicas: [
      Match.objectLike({
        Region: "ap-northeast-1",
        DeletionProtectionEnabled: true,
        PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: false },
      }),
    ],
    GlobalSecondaryIndexes: Match.absent(),
  });
  const table = Object.values(storage.findResources("AWS::DynamoDB::GlobalTable"))[0];
  expect(table.DeletionPolicy).toBe("Retain");
  expect(table.UpdateReplacePolicy).toBe("Retain");
  storage.resourceCountIs("AWS::KMS::Key", 0);
});

test("CSV and generated HTML use separate private encrypted buckets with limited retention", () => {
  storage.resourceCountIs("AWS::S3::Bucket", 3);
  for (const bucket of Object.values(storage.findResources("AWS::S3::Bucket"))) {
    expect(bucket.DeletionPolicy).toBe("Retain");
    expect(bucket.UpdateReplacePolicy).toBe("Retain");
    expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    });
    expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toEqual([
      { ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } },
    ]);
    expect(bucket.Properties.OwnershipControls).toEqual({
      Rules: [{ ObjectOwnership: "BucketOwnerEnforced" }],
    });
    expect(bucket.Properties.WebsiteConfiguration).toBeUndefined();
    expect(bucket.Properties.VersioningConfiguration).toBeUndefined();
  }
  storage.hasResourceProperties("AWS::S3::Bucket", {
    LoggingConfiguration: Match.objectLike({ LogFilePrefix: "assets/" }),
    LifecycleConfiguration: {
      Rules: [{ Status: "Enabled", AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 } }],
    },
  });
  storage.hasResourceProperties("AWS::S3::Bucket", {
    LoggingConfiguration: Match.objectLike({ LogFilePrefix: "downloads/" }),
    LifecycleConfiguration: {
      Rules: [
        {
          Status: "Enabled",
          ExpirationInDays: 1,
          AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
        },
      ],
    },
  });
  storage.hasResourceProperties("AWS::S3::Bucket", {
    LifecycleConfiguration: { Rules: [{ Status: "Enabled", ExpirationInDays: 14 }] },
  });
  storage.resourceCountIs("AWS::Lambda::Function", 0);
  storage.resourceCountIs("AWS::EC2::NatGateway", 0);
  const policies = Object.values(storage.findResources("AWS::S3::BucketPolicy"));
  expect(policies).toHaveLength(3);
  for (const policy of policies) {
    expect(policy.Properties.PolicyDocument.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Effect: "Deny",
          Condition: { Bool: { "aws:SecureTransport": "false" } },
        }),
      ]),
    );
  }
});

const template = Template.fromStack(
  createWebStack(new App(), "WebTest", {
    env: { account: "111111111111", region: "us-east-1" },
    domainName: "dashivo.example.com",
    zoneName: "example.com",
    hostedZoneId: "ZEXAMPLE",
  }),
);

test("Cognito uses code flow without a browser secret and rotates short-lived sessions", () => {
  const identity = Template.fromStack(
    createIdentityStack(new App(), "IdentityTest", {
      env: { account: "111111111111", region: "ap-northeast-1" },
      domainName: "dashivo.example.com",
    }),
  );
  identity.hasResourceProperties("AWS::Cognito::UserPool", {
    UserPoolTier: "ESSENTIALS",
    DeletionProtection: "ACTIVE",
    AdminCreateUserConfig: { AllowAdminCreateUserOnly: true },
  });
  identity.hasResourceProperties("AWS::Cognito::UserPoolClient", {
    GenerateSecret: false,
    AllowedOAuthFlows: ["code"],
    CallbackURLs: ["https://dashivo.example.com/"],
    LogoutURLs: ["https://dashivo.example.com/"],
    EnableTokenRevocation: true,
    RefreshTokenRotation: { Feature: "ENABLED", RetryGracePeriodSeconds: 10 },
    AccessTokenValidity: 10,
    ExplicitAuthFlows: ["ALLOW_USER_SRP_AUTH"],
    SupportedIdentityProviders: ["COGNITO"],
  });
  identity.hasResourceProperties("AWS::Cognito::UserPoolDomain", { ManagedLoginVersion: 1 });
  identity.resourceCountIs("AWS::Cognito::IdentityPool", 0);
  identity.resourceCountIs("AWS::Cognito::UserPoolIdentityProvider", 0);
});

test("Google credentials are resolved at deployment and enable only the configured provider", () => {
  const identity = Template.fromStack(
    createIdentityStack(new App(), "GoogleTest", {
      env: { account: "111111111111", region: "ap-northeast-1" },
      domainName: "dashivo.example.com",
      google: {
        clientId: "example.apps.googleusercontent.com",
        secretArn: "arn:aws:secretsmanager:ap-northeast-1:111111111111:secret:google-abcdef",
      },
    }),
  );
  identity.hasResourceProperties("AWS::Cognito::UserPoolIdentityProvider", {
    ProviderType: "Google",
    AttributeMapping: { email: "email" },
    ProviderDetails: Match.objectLike({
      client_id: "example.apps.googleusercontent.com",
      client_secret: Match.stringLikeRegexp("\\{\\{resolve:secretsmanager:"),
    }),
  });
  identity.hasResourceProperties("AWS::Cognito::UserPoolClient", {
    SupportedIdentityProviders: ["Google"],
  });
});

test("website storage stays private, encrypted and retained", () => {
  template.resourceCountIs("AWS::S3::Bucket", 2);
  for (const bucket of Object.values(template.findResources("AWS::S3::Bucket"))) {
    expect(bucket.DeletionPolicy).toBe("Retain");
    expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    });
    expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toEqual([
      { ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } },
    ]);
    expect(bucket.Properties.WebsiteConfiguration).toBeUndefined();
  }
  template.hasResourceProperties("AWS::S3::Bucket", {
    LifecycleConfiguration: { Rules: [Match.objectLike({ ExpirationInDays: 14 })] },
  });
});

test("CloudFront signs origin requests and restricts the bucket grant to this distribution", () => {
  template.hasResourceProperties("AWS::CloudFront::OriginAccessControl", {
    OriginAccessControlConfig: Match.objectLike({
      OriginAccessControlOriginType: "s3",
      SigningBehavior: "always",
      SigningProtocol: "sigv4",
    }),
  });
  template.hasResourceProperties("AWS::S3::BucketPolicy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Principal: { Service: "cloudfront.amazonaws.com" },
          Action: "s3:GetObject",
          Condition: { StringEquals: { "AWS:SourceArn": Match.anyValue() } },
        }),
      ]),
    },
  });
});

test("DNS, TLS and response headers protect the configured service domain", () => {
  template.hasResourceProperties("AWS::CertificateManager::Certificate", {
    DomainName: "dashivo.example.com",
    ValidationMethod: "DNS",
    DomainValidationOptions: [{ DomainName: "dashivo.example.com", HostedZoneId: "ZEXAMPLE" }],
  });
  for (const type of ["A", "AAAA"]) {
    template.hasResourceProperties("AWS::Route53::RecordSet", {
      Name: "dashivo.example.com.",
      Type: type,
      HostedZoneId: "ZEXAMPLE",
      AliasTarget: Match.objectLike({ DNSName: Match.anyValue() }),
    });
  }
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      Aliases: ["dashivo.example.com"],
      DefaultRootObject: "index.html",
      DefaultCacheBehavior: Match.objectLike({
        ViewerProtocolPolicy: "redirect-to-https",
        ResponseHeadersPolicyId: "67f7725c-6f97-4210-82d7-5512b31e9d03",
      }),
      Logging: Match.objectLike({ IncludeCookies: false }),
      ViewerCertificate: Match.objectLike({ MinimumProtocolVersion: "TLSv1.2_2021" }),
    }),
  });
  template.resourceCountIs("AWS::Lambda::Function", 0);
  template.resourceCountIs("AWS::EC2::NatGateway", 0);
});
