import { connection } from "next/server";

import { productService } from "@/server/services/productService";

import { ProductList } from "./ProductList";

export async function LaunchedProducts() {
  // Lista sempre em tempo de requisição (sem cache no MVP).
  await connection();
  const products = await productService.listLaunched();

  return <ProductList products={products} />;
}
