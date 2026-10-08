-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('LAUNCHED', 'UPCOMING');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "external_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(80) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "url" TEXT NOT NULL,
    "logo_url" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'LAUNCHED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(40) NOT NULL,
    "name" VARCHAR(60) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_topics" (
    "product_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,

    CONSTRAINT "product_topics_pkey" PRIMARY KEY ("product_id","topic_id")
);

-- CreateTable
CREATE TABLE "editorial_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "summary" VARCHAR(280),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editorial_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_external_id_key" ON "users"("external_id");

-- CreateIndex
CREATE INDEX "products_status_upvotes_created_at_idx" ON "products"("status", "upvotes" DESC, "created_at" DESC);

-- CreateIndex
CREATE INDEX "votes_product_id_idx" ON "votes"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_product_id_key" ON "votes"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "product_topics_topic_id_idx" ON "product_topics"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "editorial_reviews_product_id_key" ON "editorial_reviews"("product_id");

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_topics" ADD CONSTRAINT "product_topics_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_topics" ADD CONSTRAINT "product_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_reviews" ADD CONSTRAINT "editorial_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CHECKs (o Prisma não declara CHECK constraints; adicionados à mão com --create-only)

-- Textos obrigatórios não podem ser vazios nem só espaços.
ALTER TABLE "users" ADD CONSTRAINT "users_external_id_not_empty" CHECK (btrim("external_id") <> '');
ALTER TABLE "products" ADD CONSTRAINT "products_title_not_empty" CHECK (btrim("title") <> '');
ALTER TABLE "products" ADD CONSTRAINT "products_description_not_empty" CHECK (btrim("description") <> '');
ALTER TABLE "topics" ADD CONSTRAINT "topics_slug_not_empty" CHECK (btrim("slug") <> '');
ALTER TABLE "topics" ADD CONSTRAINT "topics_name_not_empty" CHECK (btrim("name") <> '');

-- Só http(s): bloqueia javascript:, data: etc. (a validação principal fica no Zod).
ALTER TABLE "products" ADD CONSTRAINT "products_url_http" CHECK ("url" ~* '^https?://.+');
ALTER TABLE "products" ADD CONSTRAINT "products_logo_url_http" CHECK ("logo_url" IS NULL OR "logo_url" ~* '^https?://.+');

-- Contadores nunca negativos.
ALTER TABLE "products" ADD CONSTRAINT "products_upvotes_non_negative" CHECK ("upvotes" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_visits_non_negative" CHECK ("visits" >= 0);

-- Nota editorial de 1 a 5.
ALTER TABLE "editorial_reviews" ADD CONSTRAINT "editorial_reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
