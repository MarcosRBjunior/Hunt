import { z } from "zod";

/** Slug de topic: minúsculas, números e hífen, até 40 caracteres (`varchar(40)`). */
const TOPIC_SLUG_PATTERN = /^[a-z0-9-]{1,40}$/;

/**
 * `?topic=` da lista principal: um topic por vez (regra 10). Ausente ou vazio
 * vira "sem filtro". Repetido (`?topic=a&topic=b`) ou fora do formato de slug
 * dá 400; um slug bem formado que não existe é 404, decidido no serviço.
 */
export const topicFilterSchema = z.preprocess(
  (value) => {
    // A URL entrega uma lista (`getAll`) ou, nas páginas, string ou lista.
    const single = Array.isArray(value) && value.length <= 1 ? value[0] : value;
    return single === "" || single === null ? undefined : single;
  },
  z
    .string({ error: "Escolha um topic por vez." })
    .regex(TOPIC_SLUG_PATTERN, "Topic inválido.")
    .optional(),
);
