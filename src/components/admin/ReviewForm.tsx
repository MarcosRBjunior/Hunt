"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { ApiClientError, apiFetch } from "@/lib/apiClient";
import { cn, plural } from "@/lib/utils";
import { REVIEW_SUMMARY_MAX, reviewSchema } from "@/lib/validation/review";
import type { ReviewDTO } from "@/types/api";

const RATINGS = [1, 2, 3, 4, 5] as const;

type FieldErrors = { rating?: string; summary?: string };

function firstErrors(fields: Record<string, string[] | undefined>) {
  return { rating: fields.rating?.[0], summary: fields.summary?.[0] };
}

type ReviewFormProps = {
  productId: string;
  review: ReviewDTO | null;
};

/**
 * Revisão da equipe (regra 9): nota de 1 a 5 e resumo opcional. Os produtos
 * revisados aparecem na lateral da home, por nota decrescente.
 */
export function ReviewForm({ productId, review }: ReviewFormProps) {
  const router = useRouter();
  const summaryId = useId();
  const [rating, setRating] = useState<number | null>(review?.rating ?? null);
  const [summary, setSummary] = useState(review?.summary ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    setSaved(false);

    const parsed = reviewSchema.safeParse({ rating, summary });
    if (!parsed.success) {
      return setErrors(firstErrors(z.flattenError(parsed.error).fieldErrors));
    }

    setPending(true);
    try {
      await apiFetch<ReviewDTO>(`/api/v1/admin/products/${productId}/review`, {
        method: "PUT",
        body: parsed.data,
      });
      setSaved(true);
      // A tabela do admin e a lateral da home leem do servidor.
      router.refresh();
    } catch (failure) {
      const fieldErrors: FieldErrors =
        failure instanceof ApiClientError
          ? firstErrors(failure.fieldErrors)
          : {};

      if (fieldErrors.rating || fieldErrors.summary) setErrors(fieldErrors);
      else
        setFormError(
          failure instanceof ApiClientError
            ? failure.message
            : "Não foi possível salvar a revisão. Tente de novo.",
        );
    } finally {
      setPending(false);
    }
  }

  const describedBy = [
    `${summaryId}-counter`,
    errors.summary && `${summaryId}-error`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form onSubmit={submit} noValidate className="mt-6 grid max-w-2xl gap-6">
      <fieldset
        aria-describedby={
          errors.rating ? `${summaryId}-rating-error` : undefined
        }
      >
        <legend className="text-button font-bold text-ink">Nota</legend>
        <div className="mt-2 flex items-center gap-1">
          {RATINGS.map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={value}
                aria-label={plural(value, "estrela", "estrelas")}
                checked={rating === value}
                onChange={() => {
                  setRating(value);
                  setErrors((current) => ({ ...current, rating: undefined }));
                  setSaved(false);
                }}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "block rounded-xs px-0.5 text-[28px] leading-none transition-colors duration-200 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-solid",
                  rating !== null && value <= rating
                    ? "text-star"
                    : "text-line-strong hover:text-star/60",
                )}
              >
                ★
              </span>
            </label>
          ))}
          <span className="ml-2 text-body text-ink-subtle">
            {rating === null ? "Sem nota" : `${rating}/5`}
          </span>
        </div>
        {errors.rating && (
          <p
            id={`${summaryId}-rating-error`}
            className="mt-1.5 text-body font-bold text-danger"
          >
            {errors.rating}
          </p>
        )}
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={summaryId} className="text-button font-bold text-ink">
            Resumo (opcional)
          </label>
          <span
            id={`${summaryId}-counter`}
            className={cn(
              "text-caption tabular-nums",
              summary.length > REVIEW_SUMMARY_MAX
                ? "font-bold text-danger"
                : "text-ink-subtle",
            )}
          >
            {summary.length}/{REVIEW_SUMMARY_MAX}
            <span className="sr-only"> caracteres</span>
          </span>
        </div>
        <textarea
          id={summaryId}
          name="summary"
          rows={3}
          value={summary}
          onChange={(event) => {
            setSummary(event.target.value);
            setErrors((current) => ({ ...current, summary: undefined }));
            setSaved(false);
          }}
          aria-invalid={errors.summary ? true : undefined}
          aria-describedby={describedBy}
          className="mt-2 w-full resize-y rounded-md border border-line bg-surface px-3.5 py-2.5 text-nav text-ink transition-colors duration-200 hover:border-line-strong focus-visible:border-primary aria-invalid:border-danger"
        />
        {errors.summary && (
          <p
            id={`${summaryId}-error`}
            className="mt-1.5 text-body font-bold text-danger"
          >
            {errors.summary}
          </p>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-md border border-danger bg-danger-subtle px-4 py-3 text-body font-bold text-danger"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar revisão"}
        </Button>
        <p role="status" className="text-body font-bold text-ink-soft">
          {saved ? "Revisão salva. ✓" : ""}
        </p>
      </div>
    </form>
  );
}
