"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ArrowUpIcon } from "@/components/ui/icons";
import { ApiClientError, apiFetch } from "@/lib/apiClient";
import { signInHref } from "@/lib/site";
import { cn, formatNumber, plural } from "@/lib/utils";
import type { VoteDTO } from "@/types/api";

type UpvoteButtonProps = {
  productId: string;
  title: string;
  upvotes: number;
  viewerHasVoted: boolean;
  /** Visitante não vota: o clique leva para o login. */
  signedIn: boolean;
};

type VoteState = { upvotes: number; voted: boolean };

/** Tempo que o aviso de falha fica na tela. */
const ERROR_VISIBLE_MS = 4000;

/**
 * Voto toggle com atualização otimista (regras 2 a 5): o contador muda na
 * hora e volta se a API falhar. A lista não se reordena; a nova posição
 * aparece no próximo carregamento.
 */
export function UpvoteButton({
  productId,
  title,
  upvotes,
  viewerHasVoted,
  signedIn,
}: UpvoteButtonProps) {
  const router = useRouter();
  const [server, setServer] = useState<VoteState>({
    upvotes,
    voted: viewerHasVoted,
  });
  const [local, setLocal] = useState<VoteState | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dados novos do servidor (router.refresh) substituem o estado local.
  if (server.upvotes !== upvotes || server.voted !== viewerHasVoted) {
    setServer({ upvotes, voted: viewerHasVoted });
    setLocal(null);
  }

  const current = local ?? server;

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), ERROR_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [error]);

  function goToSignIn() {
    router.push(signInHref(window.location.pathname + window.location.search));
  }

  async function toggle() {
    if (!signedIn) return goToSignIn();
    if (pending) return;

    const previous = current;
    const removing = previous.voted;
    setLocal({
      upvotes: previous.upvotes + (removing ? -1 : 1),
      voted: !removing,
    });
    setError(null);
    setPending(true);

    try {
      const result = await apiFetch<VoteDTO>(
        `/api/v1/products/${productId}/vote`,
        { method: removing ? "DELETE" : "POST" },
      );
      setLocal({ upvotes: result.upvotes, voted: result.viewerHasVoted });
    } catch (failure) {
      setLocal(previous);
      const apiError = failure instanceof ApiClientError ? failure : null;

      // Sessão expirou: entra de novo e volta para esta página.
      if (apiError?.status === 401) return goToSignIn();
      if (
        apiError?.code === "ALREADY_VOTED" ||
        apiError?.code === "VOTE_NOT_FOUND"
      ) {
        // O voto já estava no estado pedido (outra aba, por exemplo):
        // busca o contador e o estado reais.
        return router.refresh();
      }
      setError(
        removing
          ? "Não foi possível remover o voto. Tente de novo."
          : "Não foi possível votar. Tente de novo.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative z-10 justify-self-end">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={signedIn ? current.voted : undefined}
        aria-busy={pending || undefined}
        aria-label={`Votar em ${title} (${plural(current.upvotes, "voto", "votos")})`}
        className={cn(
          "flex h-[62px] w-12 flex-col items-center justify-center gap-0.5 rounded-upvote border transition duration-200 hover:-translate-y-0.5 sm:w-[54px]",
          current.voted
            ? "border-primary bg-primary text-white shadow-primary-sm hover:border-primary-hover hover:bg-primary-hover"
            : "border-line bg-surface-subtle text-ink-muted hover:border-primary-border hover:bg-primary-subtle hover:text-primary hover:shadow-primary-sm",
        )}
      >
        <ArrowUpIcon className="size-[19px]" />
        <span className="text-caption font-extrabold">
          {formatNumber(current.upvotes)}
        </span>
      </button>

      <p
        role="status"
        className={cn(
          "absolute top-full right-0 mt-1.5 w-max max-w-[220px] rounded-xs bg-ink px-2.5 py-1.5 text-caption font-bold text-white",
          !error && "sr-only",
        )}
      >
        {error}
      </p>
    </div>
  );
}
