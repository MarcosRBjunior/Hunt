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

export interface ProductRepository {
  /**
   * Produtos `LAUNCHED`, ordenados por `upvotes DESC, createdAt DESC`,
   * sem paginação.
   */
  listLaunched(): Promise<Product[]>;
}
