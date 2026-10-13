import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Acesso negado",
  robots: { index: false },
};

/** Para onde vai quem está logado, mas não é admin, ao abrir a área admin. */
export default function AcessoNegadoPage() {
  return (
    <PageShell>
      <div className="py-12">
        <EmptyState
          title="Acesso negado"
          description="Esta área é só para quem administra o nova. Se você tem a conta de admin, saia e entre com ela."
          action={
            <ButtonLink href="/" className="mt-2">
              Voltar para a home
            </ButtonLink>
          }
        />
      </div>
    </PageShell>
  );
}
