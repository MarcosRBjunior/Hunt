import { ButtonLink } from "@/components/ui/Button";

/** Login e Registro do visitante. Também é o fallback do header enquanto a sessão carrega. */
export function GuestButtons() {
  return (
    <>
      <ButtonLink
        href="/sign-in"
        prefetch={false}
        variant="secondary"
        className="max-sm:hidden"
      >
        Login
      </ButtonLink>
      <ButtonLink href="/sign-up" prefetch={false} className="max-sm:min-w-0">
        Registro <span aria-hidden="true">→</span>
      </ButtonLink>
    </>
  );
}
