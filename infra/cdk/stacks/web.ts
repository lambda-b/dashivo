import { CfnOutput, Duration, RemovalPolicy, Stack, type App, type StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  PriceClass,
  ResponseHeadersPolicy,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
  FunctionUrlOriginAccessControl,
  OriginRequestPolicy,
  OriginRequestHeaderBehavior,
  OriginRequestQueryStringBehavior,
  OriginRequestCookieBehavior,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin, S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { AaaaRecord, ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { BlockPublicAccess, Bucket, BucketEncryption, ObjectOwnership } from "aws-cdk-lib/aws-s3";

interface WebStackProps extends StackProps {
  readonly domainName: string;
  readonly zoneName: string;
  readonly hostedZoneId: string;
  readonly apiOriginDomain?: string;
}

export const createWebStack = (app: App, id: string, props: WebStackProps) => {
  const stack = new Stack(app, id, props);
  if (
    props.apiOriginDomain &&
    !/^[a-z0-9]+\.lambda-url\.ap-northeast-1\.on\.aws$/.test(props.apiOriginDomain)
  ) {
    throw new Error(
      "API origin must be a Tokyo Lambda Function URL hostname without a scheme or path.",
    );
  }
  const zone = HostedZone.fromHostedZoneAttributes(stack, "Zone", {
    hostedZoneId: props.hostedZoneId,
    zoneName: props.zoneName,
  });
  const certificate = new Certificate(stack, "Certificate", {
    domainName: props.domainName,
    validation: CertificateValidation.fromDns(zone),
  });
  const logs = new Bucket(stack, "AccessLogs", {
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
    lifecycleRules: [{ expiration: Duration.days(14) }],
    removalPolicy: RemovalPolicy.RETAIN,
  });
  const website = new Bucket(stack, "Website", {
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    removalPolicy: RemovalPolicy.RETAIN,
    serverAccessLogsBucket: logs,
    serverAccessLogsPrefix: "s3/",
  });
  const distribution = new Distribution(stack, "Distribution", {
    domainNames: [props.domainName],
    certificate,
    minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
    defaultRootObject: "index.html",
    priceClass: PriceClass.PRICE_CLASS_100,
    enableLogging: true,
    logBucket: logs,
    logFilePrefix: "cloudfront/",
    logIncludesCookies: false,
    defaultBehavior: {
      origin: S3BucketOrigin.withOriginAccessControl(website),
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS,
      compress: true,
    },
  });

  if (props.apiOriginDomain) {
    const oac = new FunctionUrlOriginAccessControl(stack, "ApiAccessControl");
    distribution.addBehavior(
      "/api/*",
      new HttpOrigin(props.apiOriginDomain, {
        originAccessControlId: oac.originAccessControlId,
        readTimeout: Duration.seconds(60),
      }),
      {
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: new OriginRequestPolicy(stack, "ApiRequestPolicy", {
          headerBehavior: OriginRequestHeaderBehavior.allowList(
            "X-Dashivo-Token",
            "Content-Type",
            "x-amz-content-sha256",
          ),
          queryStringBehavior: OriginRequestQueryStringBehavior.all(),
          cookieBehavior: OriginRequestCookieBehavior.none(),
        }),
        responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS,
      },
    );
  }

  new ARecord(stack, "Address", {
    zone,
    recordName: props.domainName,
    target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
  });
  new AaaaRecord(stack, "Ipv6Address", {
    zone,
    recordName: props.domainName,
    target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
  });

  new CfnOutput(stack, "ServiceUrl", { value: `https://${props.domainName}` });
  new CfnOutput(stack, "WebsiteBucketName", { value: website.bucketName });
  new CfnOutput(stack, "DistributionId", { value: distribution.distributionId });

  return stack;
};
