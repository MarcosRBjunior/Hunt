import type { TopicSlug } from "@/lib/topics";
import type { ProductStatus } from "@/types/api";

export type Topic = {
  slug: string;
  name: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  url: string;
  logoUrl: string | null;
  upvotes: number;
  visits: number;
  status: ProductStatus;
  topics: Topic[];
  createdAt: Date;
};

export type EditorialReview = {
  rating: number;
  summary: string | null;
};

export type ReviewedProduct = Product & { review: EditorialReview };

/** Campos que o admin define. `upvotes` e `visits` nunca vêm de fora (regra 7). */
export type NewProduct = {
  title: string;
  description: string;
  url: string;
  logoUrl: string | null;
  status: ProductStatus;
  topicSlugs: TopicSlug[];
};

/** Só os campos enviados mudam; `topicSlugs` substitui a lista inteira. */
export type ProductChanges = Partial<NewProduct>;

export interface ProductRepository {
  /**
   * Produtos `LAUNCHED`, ordenados por `upvotes DESC, createdAt DESC`,
   * sem paginação.
   */
  listLaunched(): Promise<Product[]>;

  /** Produtos com revisão, por `rating DESC, createdAt DESC`, até `limit`. */
  listReviewed(limit: number): Promise<ReviewedProduct[]>;

  /** Produtos `UPCOMING`, por `createdAt DESC`. */
  listUpcoming(): Promise<Product[]>;

  /** Todos os produtos (área admin), por `createdAt DESC`. */
  listAll(): Promise<Product[]>;

  /** Produto de qualquer status, ou `null`. */
  findById(id: string): Promise<Product | null>;

  /** Cria com 0 votos e 0 visitas. */
  create(product: NewProduct): Promise<Product>;

  /** `null` se o produto não existe. */
  update(id: string, changes: ProductChanges): Promise<Product | null>;

  /** Apaga em cascata votos, topics e revisão (regra 8). `false` se não existe. */
  delete(id: string): Promise<boolean>;

  /** `visits + 1`, atômico e sem deduplicar (regra 6). `false` se não existe. */
  incrementVisits(id: string): Promise<boolean>;
}
