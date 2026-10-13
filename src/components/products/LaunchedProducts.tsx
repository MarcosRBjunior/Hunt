import { connection } from "next/server";

import { getViewer } from "@/server/auth";
import { productService } from "@/server/services/productService";

import { ProductList } from "./ProductList";

export async function LaunchedProducts() {
  // Lista sempre em tempo de requisição (sem cache no MVP).
  await connection();
  // Com sessão, os produtos já votados chegam com o botão ativo.
  const viewer = await getViewer();
  const products = await productService.listLaunched(viewer);

  return <ProductList products={products} signedIn={viewer !== null} />;
}
