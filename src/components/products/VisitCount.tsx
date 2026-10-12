"use client";

import { createContext, use, useState, type ReactNode } from "react";

import { plural } from "@/lib/utils";

type VisitCounterValue = {
  visits: number;
  /** +1 na tela, logo depois do clique no link (o beacon já foi enviado). */
  increment: () => void;
};

const VisitCounterContext = createContext<VisitCounterValue | null>(null);

/** Liga o `ProductLink` ao `VisitCount` do mesmo card. */
export function VisitCounter({
  visits,
  children,
}: {
  visits: number;
  children: ReactNode;
}) {
  const [server, setServer] = useState(visits);
  const [clicks, setClicks] = useState(0);

  // Dados novos do servidor (router.refresh) já contam os cliques anteriores.
  if (server !== visits) {
    setServer(visits);
    setClicks(0);
  }

  return (
    <VisitCounterContext
      value={{
        visits: visits + clicks,
        increment: () => setClicks((count) => count + 1),
      }}
    >
      {children}
    </VisitCounterContext>
  );
}

/** Contador do `VisitCounter` mais próximo; `null` fora de um. */
export function useVisitCounter() {
  return use(VisitCounterContext);
}

/** "N visitas". Só exibe: as visitas nunca entram na ordenação (regra 6). */
export function VisitCount({ className }: { className?: string }) {
  const counter = useVisitCounter();
  if (!counter) return null;

  return (
    <span className={className}>
      {plural(counter.visits, "visita", "visitas")}
    </span>
  );
}
