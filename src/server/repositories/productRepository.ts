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
}
