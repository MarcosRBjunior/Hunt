import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { ACCENTS, getProductArt, ICONS } from "@/lib/productArt";

describe("getProductArt", () => {
  it("é determinístico: o mesmo id sempre gera a mesma arte", () => {
    const id = "05ad3ecd-3696-46bb-84a3-c5eedd4eda67";

    expect(getProductArt(id)).toEqual(getProductArt(id));
  });

  it("usa todos os acentos e ícones ao longo de muitos ids", () => {
    const arts = Array.from({ length: 400 }, () => getProductArt(randomUUID()));

    expect(new Set(arts.map((art) => art.accent))).toEqual(new Set(ACCENTS));
    expect(new Set(arts.map((art) => art.icon))).toEqual(new Set(ICONS));
  });
});
