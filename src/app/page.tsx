import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";

// A listagem entra no PR 3b.
export default function Home() {
  return (
    <PageShell>
      <div className="py-12">
        <EmptyState
          title="Em construção"
          description="A vitrine de produtos chega na próxima etapa."
        />
      </div>
    </PageShell>
  );
}
