export const ACCENTS = ["green", "blue", "yellow", "purple"] as const;
export const ICONS = ["spark", "layer", "sun", "orbit"] as const;

export type Accent = (typeof ACCENTS)[number];
export type ProductIcon = (typeof ICONS)[number];

/** FNV-1a de 32 bits: espalha bem ids parecidos e é estável entre execuções. */
function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}

/**
 * Arte usada quando o produto não tem `logoUrl`: um ícone e uma cor do design
 * system, sempre os mesmos para o mesmo produto (na lista e na lateral).
 */
export function getProductArt(id: string): {
  accent: Accent;
  icon: ProductIcon;
} {
  const value = hash(id);
  return {
    accent: ACCENTS[value % ACCENTS.length] ?? "purple",
    icon: ICONS[(value >>> 8) % ICONS.length] ?? "spark",
  };
}
