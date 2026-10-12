"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ApiClientError, apiFetch } from "@/lib/apiClient";

type DeleteProductButtonProps = {
  productId: string;
  title: string;
};

/** Remove um produto depois de confirmar num `<dialog>` (regra 8: apaga em cascata). */
export function DeleteProductButton({
  productId,
  title,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  async function remove() {
    setPending(true);
    setError(null);

    try {
      await apiFetch(`/api/v1/admin/products/${productId}`, {
        method: "DELETE",
      });
    } catch (failure) {
      // Já removido (em outra aba, por exemplo): só atualiza a lista.
      if (
        !(failure instanceof ApiClientError) ||
        failure.code !== "PRODUCT_NOT_FOUND"
      ) {
        setPending(false);
        setError(
          failure instanceof ApiClientError
            ? failure.message
            : "Não foi possível remover. Tente de novo.",
        );
        return;
      }
    }

    close();
    setPending(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={open}
        aria-label={`Remover ${title}`}
        className="min-w-0"
      >
        Remover
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // Esc não fecha no meio da remoção.
        onCancel={(event) => pending && event.preventDefault()}
        className="m-auto w-[min(440px,calc(100%-32px))] rounded-xl border border-line bg-surface p-6 text-left shadow-shell backdrop:bg-ink/40"
      >
        <h2 id={titleId} className="text-title font-normal text-ink">
          Remover {title}?
        </h2>
        <p className="mt-2 text-nav text-ink-subtle">
          Os votos, os topics e a revisão deste produto também serão apagados.
          Não dá para desfazer.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-body font-bold text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={remove} disabled={pending}>
            {pending ? "Removendo…" : "Remover"}
          </Button>
        </div>
      </dialog>
    </>
  );
}
