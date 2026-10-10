import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Proxy (o antigo middleware do Next) do Clerk. Ele só deixa a sessão
 * disponível para `auth()`: quem decide o acesso é cada handler e cada página
 * (CLAUDE.md › Segurança). O CSP fica no next.config.ts (src/lib/csp.ts).
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Tudo, menos arquivos internos do Next e estáticos.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Rotas de API sempre.
    "/(api)(.*)",
    // Frontend API do Clerk.
    "/__clerk/(.*)",
  ],
};
