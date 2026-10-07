import { PageShell } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <PageShell>
      <div className="py-12">
        <EmptyState
          title="Página não encontrada"
          description="O endereço pode estar errado ou a página ainda não existe."
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
