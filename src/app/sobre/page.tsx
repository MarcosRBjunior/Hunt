import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Sobre",
};

export default function SobrePage() {
  return (
    <PageShell active="sobre">
      <article className="max-w-2xl py-9 md:px-2">
        <Eyebrow>Sobre o projeto</Eyebrow>
        <h1 className="text-display font-bold text-ink">
          Descubra o próximo grande app
        </h1>

        <div className="mt-6 space-y-4 text-nav leading-relaxed text-ink-muted">
          <p>
            A nova é uma vitrine pública de produtos de startups, ordenada pelos
            votos da comunidade. Visitantes navegam pelos lançamentos e filtram
            por assunto, quem tem conta vota nos favoritos e a equipe cadastra e
            revisa os produtos.
          </p>
          <p>
            É o Projeto 06 do portfólio de Marcos Ribeiro Junior, inspirado no
            Product Hunt e construído com Next.js, React, TypeScript e Tailwind
            CSS.
          </p>
          <p>
            O código é aberto e está no{" "}
            <a
              href="https://github.com/MarcosRBjunior/Hunt"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              GitHub
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            .
          </p>
        </div>
      </article>
    </PageShell>
  );
}
