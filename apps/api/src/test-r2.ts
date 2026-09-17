import "dotenv/config";

import {
    HeadBucketCommand,
    S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("R2 environment variables are missing");
}

const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

async function main() {
    console.log("Testing Cloudflare R2 connection...");
    console.log(`Bucket: ${bucketName}`);

    await client.send(
        new HeadBucketCommand({
            Bucket: bucketName,
        }),
    );

    console.log("✅ R2 connection successful!");
    console.log(`✅ Bucket "${bucketName}" is accessible.`);
}

main().catch((error) => {
    console.error("❌ R2 connection failed.");
    console.error(error);
    process.exit(1);
});