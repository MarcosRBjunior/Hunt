/**
 * Domínio da instância do Clerk (Frontend API), que vem codificado na chave
 * pública: `pk_test_` + base64("<domínio>$").
 */
export function clerkFrontendApi(publishableKey: string): string {
  const decoded = atob(publishableKey.split("_")[2] ?? "");

  if (!decoded.endsWith("$")) {
    throw new Error("Chave pública do Clerk inválida");
  }

  return decoded.slice(0, -1);
}

/**
 * CSP por lista de domínios, compatível com o Clerk (configuração manual da
 * documentação dele). O CSP automático do `clerkMiddleware` libera scripts de
 * qualquer origem (`https: http:`), por isso não é usado.
 */
export function buildContentSecurityPolicy({
  publishableKey,
  dev,
}: {
  publishableKey: string;
  dev: boolean;
}): string {
  const clerk = `https://${clerkFrontendApi(publishableKey)}`;
  // Desafio anti-bot do Clerk.
  const cloudflare = "https://challenges.cloudflare.com";
  const clerkProtect = "https://*.protect.clerk.com";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-inline': scripts inline do App Router (sem nonce, para manter a
    // casca estática). 'unsafe-eval' só no `next dev`.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(dev ? ["'unsafe-eval'"] : []),
      clerk,
      cloudflare,
    ],
    "connect-src": [
      "'self'",
      clerk,
      `${clerkProtect}:*`,
      "https://clerk-telemetry.com",
    ],
    // Logos são URLs https cadastradas pelo admin; avatares vêm do Clerk.
    "img-src": ["'self'", "https:", "data:"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "font-src": ["'self'"],
    "frame-src": ["'self'", cloudflare, clerkProtect],
    "worker-src": ["'self'", "blob:"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}
