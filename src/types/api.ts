export type ProductStatus = "LAUNCHED" | "UPCOMING";

export type TopicDTO = {
  slug: string;
  name: string;
};

/** Item de `GET /topics`. */
export type TopicWithCountDTO = TopicDTO & {
  /** Quantos produtos `LAUNCHED` têm o topic. */
  productCount: number;
};

export type ProductDTO = {
  id: string;
  title: string;
  description: string;
  url: string;
  logoUrl: string | null;
  upvotes: number;
  visits: number;
  status: ProductStatus;
  topics: TopicDTO[];
  viewerHasVoted: boolean;
  /** ISO 8601 */
  createdAt: string;
};

export type ReviewDTO = {
  /** 1 a 5 */
  rating: number;
  summary: string | null;
};

export type ReviewedProductDTO = ProductDTO & {
  review: ReviewDTO;
};

/** Produto na área admin: com a revisão, se houver. */
export type AdminProductDTO = ProductDTO & {
  review: ReviewDTO | null;
};

/** Resposta de `POST` e `DELETE /products/{id}/vote`. */
export type VoteDTO = {
  productId: string;
  /** Total depois do voto (ou da remoção). */
  upvotes: number;
  viewerHasVoted: boolean;
};

/** Resposta de `GET /api/health`. */
export type HealthDTO = {
  status: "ok";
  /** `skipped` com `PRODUCT_SOURCE=mock` (o app não usa banco). */
  database: "ok" | "skipped";
};

export type ApiSuccess<T> = {
  data: T;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
};
