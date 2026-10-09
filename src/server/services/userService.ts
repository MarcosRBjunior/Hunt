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
  };
}

export type UserService = ReturnType<typeof createUserService>;

export const userService = createUserService({ userRepository });
