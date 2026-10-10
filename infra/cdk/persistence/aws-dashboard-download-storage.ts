import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { dashboardIdSchema } from "@dashivo/shared-schema/dashboard";
import {
  downloadUrlLifetimeSeconds,
  type DashboardDownloadStorage,
} from "@dashivo/server/models/dashboard-html-builder";

export const createAwsDashboardDownloadStorage = ({
  ownerId,
  bucket,
  s3,
}: {
  ownerId: string;
  bucket: string;
  s3: S3Client;
}): DashboardDownloadStorage => {
  const owner = z.uuid().parse(ownerId);

  return async (dashboardId, html) => {
    const id = dashboardIdSchema.parse(dashboardId);
    const key = `users/${owner}/dashboards/${id}/${randomUUID()}.html`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: new Uint8Array(html),
        ContentType: "text/html; charset=utf-8",
        ContentDisposition: `attachment; filename="${id}.html"`,
        CacheControl: "private, no-store",
      }),
    );

    return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: downloadUrlLifetimeSeconds,
    });
  };
};
