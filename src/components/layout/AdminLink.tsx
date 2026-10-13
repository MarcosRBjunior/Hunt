"use client";

import { useAuth } from "@clerk/nextjs";

import { ButtonLink } from "@/components/ui/Button";

/**
 * Atalho para a área admin, só para quem tem o papel no token (o mesmo claim
 * que o servidor confere). É só navegação: as páginas e a API checam o papel
 * de novo no servidor.
 */
export function AdminLink() {
  const { sessionClaims } = useAuth();
  if (sessionClaims?.metadata?.role !== "admin") return null;

  return (
    <ButtonLink
      href="/admin/produtos"
      variant="secondary"
      className="max-sm:min-w-0"
    >
      Admin
    </ButtonLink>
  );
}
