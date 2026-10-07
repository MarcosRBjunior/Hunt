/** Junta classes CSS, ignorando valores falsos. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const numberFormat = new Intl.NumberFormat("pt-BR");

/** 1240 → "1.240" */
export function formatNumber(value: number) {
  return numberFormat.format(value);
}

/** Ex.: plural(1, "visita", "visitas") → "1 visita". */
export function plural(count: number, singular: string, pluralForm: string) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}
