import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ValidationError } from "@/server/errors";
import { parseInput } from "@/server/validation";

const schema = z.object({
  title: z.string().min(1, "Informe o nome."),
  topicSlugs: z.array(
    z.enum(["saas", "tech"], { error: "Topic inexistente." }),
  ),
});

describe("parseInput", () => {
  it("devolve os dados validados", () => {
    expect(
      parseInput(schema, { title: "Layer", topicSlugs: ["saas"], extra: 1 }),
    ).toEqual({ title: "Layer", topicSlugs: ["saas"] });
  });

  it("lança ValidationError (400) com as mensagens por campo em details.fields", () => {
    const error = (() => {
      try {
        parseInput(schema, { title: "", topicSlugs: ["saas", "x"] });
      } catch (e) {
        return e;
      }
    })();

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toHaveProperty("status", 400);
    expect(error).toHaveProperty("details", {
      fields: {
        title: ["Informe o nome."],
        topicSlugs: ["Topic inexistente."],
      },
    });
  });

  it("aceita um nome de campo para valores soltos (ex.: id da URL)", () => {
    expect(() => parseInput(z.uuid(), "123", "id")).toThrow(ValidationError);

    try {
      parseInput(z.uuid({ error: "Id inválido." }), "123", "id");
    } catch (error) {
      expect(error).toHaveProperty("details", {
        fields: { id: ["Id inválido."] },
      });
    }
  });
});
