"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { z } from "zod";

import { Button, ButtonLink } from "@/components/ui/Button";
import { ApiClientError, apiFetch } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { httpUrlSchema } from "@/lib/validation/common";
import {
  PRODUCT_DESCRIPTION_MAX,
  PRODUCT_TITLE_MAX,
  productFormSchema,
} from "@/lib/validation/product";
import type { ProductDTO, ProductStatus } from "@/types/api";

type Values = {
  title: string;
  description: string;
  url: string;
  logoUrl: string;
  status: ProductStatus;
};

type FieldName = keyof Values;
type FieldErrors = Partial<Record<FieldName, string>>;

/** Ordem dos campos na tela: o foco vai para o primeiro com erro. */
const FIELD_ORDER: FieldName[] = [
  "title",
  "description",
  "url",
  "logoUrl",
  "status",
];

/** Espera antes de carregar a prévia do logo enquanto a URL é digitada. */
const PREVIEW_DELAY_MS = 400;

const inputClasses =
  "mt-2 w-full rounded-md border border-line bg-surface px-3.5 text-nav text-ink transition-colors duration-200 placeholder:text-ink-subtle hover:border-line-strong focus-visible:border-primary aria-invalid:border-danger";

/** Só a primeira mensagem de cada campo conhecido. */
function firstErrors(fields: Record<string, string[] | undefined>) {
  const errors: FieldErrors = {};
  for (const name of FIELD_ORDER) {
    const message = fields[name]?.[0];
    if (message) errors[name] = message;
  }
  return errors;
}

/**
 * Cadastro e edição de produto (área admin). Valida com o mesmo schema Zod
 * do servidor e mostra os erros da API no campo certo.
 */
export function ProductForm({ product }: { product?: ProductDTO }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>({
    title: product?.title ?? "",
    description: product?.description ?? "",
    url: product?.url ?? "",
    logoUrl: product?.logoUrl ?? "",
    status: product?.status ?? "LAUNCHED",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function change(name: FieldName) {
    return (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { value } = event.target;
      setValues((current) => ({ ...current, [name]: value }));
      setErrors((current) => ({ ...current, [name]: undefined }));
    };
  }

  function showErrors(fieldErrors: FieldErrors) {
    setErrors(fieldErrors);
    const first = FIELD_ORDER.find((name) => fieldErrors[name]);
    const field = first && formRef.current?.elements.namedItem(first);
    if (field instanceof HTMLElement) field.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const parsed = productFormSchema.safeParse({
      title: values.title,
      description: values.description,
      url: values.url.trim(),
      logoUrl: values.logoUrl.trim() || null,
      status: values.status,
    });
    if (!parsed.success) {
      return showErrors(firstErrors(z.flattenError(parsed.error).fieldErrors));
    }

    setPending(true);
    try {
      await apiFetch<ProductDTO>(
        product
          ? `/api/v1/admin/products/${product.id}`
          : "/api/v1/admin/products",
        { method: product ? "PATCH" : "POST", body: parsed.data },
      );
    } catch (failure) {
      setPending(false);
      const fieldErrors =
        failure instanceof ApiClientError
          ? firstErrors(failure.fieldErrors)
          : {};

      if (Object.keys(fieldErrors).length > 0) return showErrors(fieldErrors);
      return setFormError(
        failure instanceof ApiClientError
          ? failure.message
          : "Não foi possível salvar. Tente de novo.",
      );
    }

    // A lista do admin e a home leem do servidor a cada requisição.
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="mt-8 grid max-w-2xl gap-6"
    >
      <Field
        label="Nome"
        error={errors.title}
        counter={{ length: values.title.length, max: PRODUCT_TITLE_MAX }}
      >
        {(describedBy, id) => (
          <input
            id={id}
            name="title"
            value={values.title}
            onChange={change("title")}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={describedBy}
            className={cn(inputClasses, "h-[42px]")}
          />
        )}
      </Field>

      <Field
        label="Descrição"
        error={errors.description}
        counter={{
          length: values.description.length,
          max: PRODUCT_DESCRIPTION_MAX,
        }}
      >
        {(describedBy, id) => (
          <textarea
            id={id}
            name="description"
            rows={4}
            value={values.description}
            onChange={change("description")}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={describedBy}
            className={cn(inputClasses, "resize-y py-2.5")}
          />
        )}
      </Field>

      <Field
        label="Endereço do site"
        hint="Abre em nova aba quando alguém clica no produto."
        error={errors.url}
      >
        {(describedBy, id) => (
          <input
            id={id}
            name="url"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={values.url}
            onChange={change("url")}
            aria-invalid={errors.url ? true : undefined}
            aria-describedby={describedBy}
            className={cn(inputClasses, "h-[42px]")}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <Field
          label="Endereço do logo (opcional)"
          hint="Imagem quadrada em http(s). Sem logo, o card usa a arte padrão."
          error={errors.logoUrl}
        >
          {(describedBy, id) => (
            <input
              id={id}
              name="logoUrl"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={values.logoUrl}
              onChange={change("logoUrl")}
              aria-invalid={errors.logoUrl ? true : undefined}
              aria-describedby={describedBy}
              className={cn(inputClasses, "h-[42px]")}
            />
          )}
        </Field>
        <LogoPreview url={values.logoUrl} />
      </div>

      <Field
        label="Status"
        hint="Em breve: fica fora da lista principal, aparece na lateral e não recebe votos."
        error={errors.status}
      >
        {(describedBy, id) => (
          <select
            id={id}
            name="status"
            value={values.status}
            onChange={change("status")}
            aria-invalid={errors.status ? true : undefined}
            aria-describedby={describedBy}
            className={cn(inputClasses, "h-[42px] sm:max-w-60")}
          >
            <option value="LAUNCHED">Lançado</option>
            <option value="UPCOMING">Em breve</option>
          </select>
        )}
      </Field>

      {formError && (
        <p
          role="alert"
          className="rounded-md border border-danger bg-danger-subtle px-4 py-3 text-body font-bold text-danger"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando…"
            : product
              ? "Salvar alterações"
              : "Cadastrar produto"}
        </Button>
        <ButtonLink href="/admin/produtos" variant="secondary">
          Cancelar
        </ButtonLink>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  counter?: { length: number; max: number };
  /** Recebe o `aria-describedby` e o `id` do controle. */
  children: (describedBy: string | undefined, id: string) => ReactNode;
};

function Field({ label, hint, error, counter, children }: FieldProps) {
  const id = useId();
  const describedBy =
    [hint && `${id}-hint`, counter && `${id}-counter`, error && `${id}-error`]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-button font-bold text-ink">
          {label}
        </label>
        {counter && (
          <span
            id={`${id}-counter`}
            className={cn(
              "text-caption tabular-nums",
              counter.length > counter.max
                ? "font-bold text-danger"
                : "text-ink-subtle",
            )}
          >
            {counter.length}/{counter.max}
            <span className="sr-only"> caracteres</span>
          </span>
        )}
      </div>
      {children(describedBy, id)}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-body text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-body font-bold text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Prévia do logo, no tamanho do card da home. */
function LogoPreview({ url }: { url: string }) {
  const [previewUrl, setPreviewUrl] = useState(url.trim());
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setPreviewUrl(url.trim()), PREVIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [url]);

  const valid =
    previewUrl !== "" && httpUrlSchema.safeParse(previewUrl).success;
  const message = !valid
    ? "Prévia do logo"
    : failedUrl === previewUrl
      ? "Não foi possível carregar a imagem"
      : null;

  return (
    <figure className="flex items-center gap-3 sm:mt-7 sm:w-[140px] sm:flex-col sm:items-start sm:gap-2">
      <div className="grid size-[58px] shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface-subtle">
        {valid && failedUrl !== previewUrl && (
          // Logos vêm de qualquer host informado pelo admin: sem otimizador do Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Prévia do logo"
            onError={() => setFailedUrl(previewUrl)}
            className="size-full object-cover"
          />
        )}
      </div>
      {message && (
        <figcaption className="text-caption text-ink-subtle">
          {message}
        </figcaption>
      )}
    </figure>
  );
}
