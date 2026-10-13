/**
 * O mock (nível 1) só lê `src/mocks/products.json`. Votos, visitas e o admin
 * gravam no banco: com `PRODUCT_SOURCE=mock` as escritas falham (500, com este
 * aviso no log).
 */
export class ReadOnlySourceError extends Error {
  constructor() {
    super(
      "PRODUCT_SOURCE=mock é só leitura: use PRODUCT_SOURCE=prisma para gravar.",
    );
    this.name = "ReadOnlySourceError";
  }
}
