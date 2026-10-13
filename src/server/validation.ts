import { z } from "zod";

import { ValidationError } from "./errors";

/**
 * Valida uma entrada com Zod e devolve os dados limpos. Na falha, lança
 * `ValidationError` (400) com as mensagens por campo em `details.fields`.
 * `field` nomeia valores soltos, como o id que vem da URL.
 */
export function parseInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  field?: string,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const flattened = z.flattenError(result.error);
  const fields = field
    ? { [field]: flattened.formErrors }
    : flattened.fieldErrors;

  throw new ValidationError("Dados inválidos.", { details: { fields } });
}
