const sensitiveKeys = new Set([
  "authorization",
  "access_token",
  "token",
  "secret",
  "tax_id",
  "document",
]);

export function sanitizePayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizePayload);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeys.has(key.toLowerCase())
        ? "[REDACTED]"
        : sanitizePayload(entry),
    ]),
  );
}
