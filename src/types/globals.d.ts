export {};

/** Papéis do app. Vêm só do `publicMetadata` do Clerk (regra 12). */
export type Role = "admin";

declare global {
  /**
   * Claims extras do token de sessão. No dashboard do Clerk (Sessions ›
   * Customize session token): `{ "metadata": "{{user.public_metadata}}" }`.
   */
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: Role;
    };
  }
}
