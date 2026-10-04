import { expect, test } from "@playwright/test";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { createWebStack } from "@dashivo/infra-cdk/stacks/web";

const template = Template.fromStack(
  createWebStack(new App(), "WebTest", {
    env: { account: "111111111111", region: "us-east-1" },
    domainName: "dashivo.example.com",
    zoneName: "example.com",
    hostedZoneId: "ZEXAMPLE",
  }),
);

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
