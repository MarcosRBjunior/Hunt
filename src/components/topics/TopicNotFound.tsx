import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** `?topic=` que não existe (TC-14): aviso só na coluna principal. */
export function TopicNotFound() {
  return (
    <div className="mt-[22px]">
      <EmptyState
        title="Categoria não encontrada"
        description="Escolha um dos trending topics acima ou limpe o filtro para ver todos os produtos."
        action={
          <ButtonLink href="/" variant="secondary" className="mt-2">
            Limpar filtro
          </ButtonLink>
        }
      />
    </div>
  );
}
