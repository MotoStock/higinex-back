/**
 * Extracts the value of a specific cookie from a raw HTTP `Cookie` header.
 *
 * This helper parses the `Cookie` header manually to avoid coupling the
 * application to framework-specific cookie parsers (e.g. `cookie-parser`)
 * and to remain compatible with different HTTP adapters (Express, Fastify).
 *
 * The function:
 * - Safely handles missing or empty cookie headers
 * - Ignores malformed cookie segments
 * - Supports URL-encoded cookie values
 * - Never throws; returns `undefined` if the cookie is not found
 *
 * @param cookieHeader - Raw `Cookie` header string (e.g. "a=1; refresh=xyz")
 * @param name - Name of the cookie to retrieve
 * @returns The decoded cookie value if found, otherwise `undefined`
 *
 * @example
 * ```ts
 * const refreshToken = getCookieValue(
 *   req.headers.cookie,
 *   'refresh_token',
 * );
 *
 * if (!refreshToken) {
 *   throw new UnauthorizedException('Missing refresh token');
 * }
 * ```
 */
export function getCookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex);
    if (key !== name) continue;

    const rawValue = trimmed.slice(eqIndex + 1);
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return undefined;
}
