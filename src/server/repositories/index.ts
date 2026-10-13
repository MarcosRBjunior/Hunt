import { getPrisma } from "../db";
import { env } from "../env";
import { MockProductRepository } from "./mockProductRepository";
import { PrismaProductRepository } from "./prismaProductRepository";
import type { ProductRepository } from "./productRepository";
import {
  MockTopicRepository,
  PrismaTopicRepository,
  type TopicRepository,
} from "./topicRepository";
import { PrismaUserRepository, type UserRepository } from "./userRepository";
import {
  MockVoteRepository,
  PrismaVoteRepository,
  type VoteRepository,
} from "./voteRepository";

/** `PRODUCT_SOURCE` escolhe a fonte; a UI não sabe qual é (CLAUDE.md › Arquitetura). */
export const productRepository: ProductRepository =
  env.PRODUCT_SOURCE === "prisma"
    ? new PrismaProductRepository(getPrisma())
    : new MockProductRepository();

/** Votos acompanham a fonte dos produtos: no mock (só leitura) não há votos. */
export const voteRepository: VoteRepository =
  env.PRODUCT_SOURCE === "prisma"
    ? new PrismaVoteRepository(getPrisma())
    : new MockVoteRepository();

/** Topics (com a contagem de produtos) vêm da mesma fonte dos produtos. */
export const topicRepository: TopicRepository =
  env.PRODUCT_SOURCE === "prisma"
    ? new PrismaTopicRepository(getPrisma())
    : new MockTopicRepository();

/** Usuários só existem no banco (são criados na primeira ação autenticada). */
export const userRepository: UserRepository = new PrismaUserRepository(
  getPrisma,
);
