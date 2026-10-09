import { auth } from "@clerk/nextjs/server";

import { ForbiddenError, UnauthenticatedError } from "./errors";
import { userService, type UserService } from "./services/userService";

/** Quem está vendo a página: só o que vem do token, sem tocar no banco. */
export type Viewer = {
  /** Id do usuário no Clerk. */
  externalId: string;
  isAdmin: boolean;
};

/** Usuário autenticado com o id interno (tabela `users`). */
export type AuthenticatedUser = Viewer & {
  userId: string;
};

/** O pedaço da sessão do Clerk que o app usa. */
type Session = {
  userId: string | null;
  sessionClaims: CustomJwtSessionClaims | null;
};

type Dependencies = {
  readSession: () => Promise<Session>;
  userService: Pick<UserService, "ensureUser">;
};

/**
 * Sessão e papel conferidos no servidor, dentro de cada handler (CLAUDE.md ›
 * Segurança). O papel vem do `publicMetadata`, exposto no token por custom
 * claims; `unsafeMetadata` nunca entra no token e é ignorado.
 */
export function createAuth({ readSession, userService }: Dependencies) {
  async function getViewer(): Promise<Viewer | null> {
    const { userId, sessionClaims } = await readSession();
    if (!userId) return null;

    return {
      externalId: userId,
      isAdmin: sessionClaims?.metadata?.role === "admin",
    };
  }

  return {
    getViewer,

    /** 401 sem sessão; garante o usuário local (upsert por `external_id`). */
    async requireUser(): Promise<AuthenticatedUser> {
      const viewer = await getViewer();
      if (!viewer) throw new UnauthenticatedError();

      const user = await userService.ensureUser(viewer.externalId);
      return { ...viewer, userId: user.id };
    },

    /** 401 sem sessão, 403 sem papel de admin. Não grava nada no banco. */
    async requireAdmin(): Promise<Viewer> {
      const viewer = await getViewer();
      if (!viewer) throw new UnauthenticatedError();
      if (!viewer.isAdmin) throw new ForbiddenError();

      return viewer;
    },
  };
}

export const { getViewer, requireUser, requireAdmin } = createAuth({
  readSession: () => auth(),
  userService,
});
