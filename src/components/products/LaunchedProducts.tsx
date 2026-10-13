import { connection } from "next/server";

import { TopicNotFound } from "@/components/topics/TopicNotFound";
import { findTopic } from "@/lib/topics";
import { getViewer } from "@/server/auth";
import { NotFoundError, ValidationError } from "@/server/errors";
import { productService } from "@/server/services/productService";

import { ProductList } from "./ProductList";

type LaunchedProductsProps = {
  /** Só na home: o filtro `?topic=` (a página /produtos mostra todos). */
  searchParams?: PageProps<"/">["searchParams"];
};

export async function LaunchedProducts({
  searchParams,
}: LaunchedProductsProps) {
  // Lista sempre em tempo de requisição (sem cache no MVP).
  await connection();
  const topic = (await searchParams)?.topic;
  // Com sessão, os produtos já votados chegam com o botão ativo.
  const viewer = await getViewer();

  const products = await productService
    .listLaunched(viewer, topic)
    .catch((error: unknown) => {
      // Topic inexistente (404) ou mal formado (400): aviso na coluna, sem
      // derrubar a página. A lateral não muda (regra 10).
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        return null;
      }
      throw error;
    });

  if (!products) return <TopicNotFound />;

  return (
    <ProductList
      products={products}
      signedIn={viewer !== null}
      topic={typeof topic === "string" ? findTopic(topic) : undefined}
    />
  );
}
