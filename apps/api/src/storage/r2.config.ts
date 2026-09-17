import * as dotenv from "dotenv";

dotenv.config();

export function getR2AccessKey(): string {
  return process.env.CLOUDFLARE_ACCESS_KEY ?? "";
}

export function getR2SecretKey(): string {
  return process.env.CLOUDFLARE_SECRET_KEY ?? "";
}

export function getR2Region(): string {
  return process.env.CLOUDFLARE_REGION ?? "auto";
}

export function getR2BucketName(): string {
  return process.env.CLOUDFLARE_BUCKET_NAME ?? "";
}

export function getR2Endpoint(): string {
  return (process.env.CLOUDFLARE_BUCKET_URL ?? "").replace(/\/$/, "");
}

export function getR2PublicBaseUrl(): string {
  return (process.env.CLOUDFLARE_PUBLIC_URL ?? "").replace(/\/$/, "");
}
