import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env.js";

if (
    !env.r2AccountId ||
    !env.r2AccessKeyId ||
    !env.r2SecretAccessKey ||
    !env.r2BucketName
) {
    throw new Error(
        "R2 environment variables are not configured",
    );
}

export const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
    },
});

export async function uploadToR2(
    key: string,
    body: Buffer,
    contentType: string,
) {
    await r2Client.send(
        new PutObjectCommand({
            Bucket: env.r2BucketName,
            Key: key,
            Body: body,
            ContentType: contentType,
        }),
    );
}

export async function createSignedR2Url(
    key: string,
    expiresInSeconds = 300,
) {
    const command = new GetObjectCommand({
        Bucket: env.r2BucketName,
        Key: key,
    });

    return getSignedUrl(
        r2Client,
        command,
        {
            expiresIn: expiresInSeconds,
        },
    );
}