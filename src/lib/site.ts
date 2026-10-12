export const SITE_NAME = "nova";

export const NAV_ITEMS = [
  { key: "produtos", label: "Produtos", href: "/produtos" },
  { key: "categorias", label: "Categorias", href: "/categorias" },
  { key: "sobre", label: "Sobre", href: "/sobre" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

export const AUTHOR_LINKS = [
  { label: "GitHub", href: "https://github.com/MarcosRBjunior" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/marcos-ribeirojr" },
] as const;

/** Login do Clerk que, depois de entrar, volta para `returnTo` (caminho do site). */
export function signInHref(returnTo: string) {
  return `/sign-in?${new URLSearchParams({ redirect_url: returnTo })}`;
}
