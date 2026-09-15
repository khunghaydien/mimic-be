import { Transform } from "class-transformer";

export function trimString(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

export function trimToUndefined(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function normalizeEmail(value: unknown): unknown {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

export const Trim = () => Transform(({ value }) => trimString(value));

export const TrimOptional = () =>
  Transform(({ value }) => trimToUndefined(value));

export const NormalizeEmail = () =>
  Transform(({ value }) => normalizeEmail(value));
