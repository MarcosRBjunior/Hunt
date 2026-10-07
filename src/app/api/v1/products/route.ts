import { connection } from "next/server";

import { productService } from "@/server/services/productService";
import type { ApiSuccess, ProductDTO } from "@/types/api";

export async function GET() {
  // Sempre em tempo de requisição: a lista muda com votos (sem cache no MVP).
  await connection();

  const products = await productService.listLaunched();

  return Response.json({ data: products } satisfies ApiSuccess<ProductDTO[]>);
}
