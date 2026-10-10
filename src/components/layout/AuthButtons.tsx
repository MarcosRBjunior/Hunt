import { Show, UserButton } from "@clerk/nextjs";

import { GuestButtons } from "./GuestButtons";

/**
 * Login/Registro para visitantes, menu do usuário para quem está logado.
 * Server Component: o `<Show>` lê a sessão no servidor (por isso fica dentro
 * de um `<Suspense>` no header). O link "Admin" entra na Fase 8.
 */
export function AuthButtons() {
  return (
    <>
      <Show when="signed-out">
        <GuestButtons />
      </Show>
      <Show when="signed-in">
        {/* Altura dos botões: o avatar aparece sem empurrar o header. */}
        <div className="flex h-[42px] items-center">
          <UserButton />
        </div>
      </Show>
    </>
  );
}
