import { Show, UserButton } from "@clerk/nextjs";

import { AdminLink } from "./AdminLink";
import { GuestButtons } from "./GuestButtons";

/**
 * Login/Registro para visitantes; menu do usuário (e o link Admin, só para
 * admin) para quem está logado. Server Component: o `<Show>` lê a sessão no
 * servidor (por isso fica dentro de um `<Suspense>` no header). Não importa
 * nada de `src/server`: o `error.tsx` (cliente) também desenha o header.
 */
export function AuthButtons() {
  return (
    <>
      <Show when="signed-out">
        <GuestButtons />
      </Show>
      <Show when="signed-in">
        {/* Altura dos botões: o avatar aparece sem empurrar o header. */}
        <div className="flex h-[42px] items-center gap-3">
          <AdminLink />
          <UserButton />
        </div>
      </Show>
    </>
  );
}
