import { describe, expect, it } from "vitest";

import { topicFilterSchema } from "@/lib/validation/topic";

describe("topicFilterSchema", () => {
  it.each([
    ["saas", "saas"],
    [["saas"], "saas"],
    ["inexistente", "inexistente"],
    ["a-b-1", "a-b-1"],
  ])("aceita %j como %j", (input, expected) => {
    expect(topicFilterSchema.parse(input)).toBe(expected);
  });

  it.each([undefined, null, "", [], [""]])(
    "trata %j como sem filtro",
    (input) => {
      expect(topicFilterSchema.parse(input)).toBeUndefined();
    },
  );

  it("recusa mais de um topic (um por vez, regra 10)", () => {
    const result = topicFilterSchema.safeParse(["saas", "tech"]);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Escolha um topic por vez.");
  });

  it.each(["SaaS", "saas tech", "../admin", "a".repeat(41), "saas!"])(
    "recusa o slug mal formado %j",
    (input) => {
      const result = topicFilterSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Topic inválido.");
    },
  );
});
