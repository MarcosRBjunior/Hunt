import { ValidationError } from "../errors";
import { userRepository } from "../repositories";
import type { User, UserRepository } from "../repositories/userRepository";

type Dependencies = {
  userRepository: UserRepository;
};

export function createUserService({ userRepository }: Dependencies) {
  return {
    /**
     * Usuário local da sessão: criado por `external_id` (id do Clerk) na
     * primeira ação autenticada e reaproveitado nas próximas (regra 11, TC-15).
     */
    async ensureUser(externalId: string): Promise<User> {
      if (externalId.trim() === "") {
        throw new ValidationError("Id externo do usuário vazio.");
      }

      return userRepository.upsertByExternalId(externalId);
    },

    /**
     * Usuário apagado no Clerk (webhook `user.deleted`): some daqui e os votos
     * dele saem dos contadores. Repetir o evento não muda nada.
     */
    async removeDeletedUser(
      externalId: string,
    ): Promise<{ removed: boolean; votesRemoved: number }> {
      if (externalId.trim() === "") {
        throw new ValidationError("Id externo do usuário vazio.");
      }

      const result = await userRepository.deleteByExternalId(externalId);
      return result
        ? { removed: true, votesRemoved: result.votesRemoved }
        : { removed: false, votesRemoved: 0 };
    },
  };
}

export type UserService = ReturnType<typeof createUserService>;

export const userService = createUserService({ userRepository });
