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
