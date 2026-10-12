"use client";

import type { MouseEvent, ReactNode } from "react";

import { useVisitCounter } from "./VisitCount";

/**
 * Registra a visita sem segurar a navegação: `sendBeacon` sobrevive à troca
 * de aba; sem ele (ou se o navegador recusar), `fetch` com `keepalive`.
 * Falhas são ignoradas: o link abre de qualquer jeito.
 */
export function sendVisit(productId: string) {
  const url = `/api/v1/products/${productId}/visit`;

  try {
    if (navigator.sendBeacon?.(url)) return;
  } catch {
    // Segue para o fetch.
  }
  fetch(url, { method: "POST", keepalive: true }).catch(() => {});
}

type ProductLinkProps = {
  productId: string;
  href: string;
  className?: string;
  children: ReactNode;
};

/**
 * Link para o site do produto, em nova aba (regra 13). Cada clique soma 1
 * visita, de qualquer perfil e sem deduplicar (regra 6).
 */
export function ProductLink({
  productId,
  href,
  className,
  children,
}: ProductLinkProps) {
  const counter = useVisitCounter();

  function registerVisit() {
    sendVisit(productId);
    counter?.increment();
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={registerVisit}
      // Botão do meio também abre o link (em outra aba).
      onAuxClick={(event: MouseEvent) => {
        if (event.button === 1) registerVisit();
      }}
    >
      {children}
    </a>
  );
}
