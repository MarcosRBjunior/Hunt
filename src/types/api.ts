export type ProductStatus = "LAUNCHED" | "UPCOMING";

export type TopicDTO = {
  slug: string;
  name: string;
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
