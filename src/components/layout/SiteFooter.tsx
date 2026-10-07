import { AUTHOR_LINKS } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-[22px] flex flex-col gap-3 border-t border-line-soft px-2 pt-[18px] text-caption text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
      <p>Projeto 06 · Desenvolvido por Marcos Ribeiro Junior</p>
      <ul className="flex gap-4">
        {AUTHOR_LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-ink-muted transition-colors duration-200 hover:text-primary"
            >
              {link.label}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
