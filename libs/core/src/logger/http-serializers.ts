function header(
  headers: Record<string, unknown> | undefined,
  name: string,
): string | undefined {
  if (!headers) {
    return undefined;
  }
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === "string" ? value : undefined;
}

export function deviceFromUserAgent(userAgent: string | undefined): string {
  if (!userAgent) {
    return "unknown";
  }

  if (/postman/i.test(userAgent)) {
    return "Postman";
  }
  if (/insomnia/i.test(userAgent)) {
    return "Insomnia";
  }
  if (/curl/i.test(userAgent)) {
    return "curl";
  }

  const os = /iPhone|iPad/i.test(userAgent)
    ? "iOS"
    : /Android/i.test(userAgent)
      ? "Android"
      : /Mac OS X|Macintosh/i.test(userAgent)
        ? "macOS"
        : /Windows/i.test(userAgent)
          ? "Windows"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : undefined;

  const browser = /Edg\//i.test(userAgent)
    ? "Edge"
    : /Chrome\//i.test(userAgent)
      ? "Chrome"
      : /Firefox\//i.test(userAgent)
        ? "Firefox"
        : /Safari\//i.test(userAgent)
          ? "Safari"
          : undefined;

  if (os && browser) {
    return `${os} / ${browser}`;
  }
  return os ?? browser ?? "unknown";
}

export function serializeHttpRequest(req: {
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
}) {
  return {
    method: req.method,
    url: req.url,
    device: deviceFromUserAgent(header(req.headers, "user-agent")),
  };
}

export function serializeHttpResponse(res: { statusCode?: number }) {
  return {
    statusCode: res.statusCode,
  };
}
