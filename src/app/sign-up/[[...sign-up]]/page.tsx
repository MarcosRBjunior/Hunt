import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthFormSkeleton } from "@/components/layout/AuthFormSkeleton";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Registro",
};

/** Registro do Clerk (e-mail/senha ou GitHub). */
export default function SignUpPage() {
  return (
    <PageShell>
      <div className="flex justify-center py-12">
        {/* O formulário lê a URL no navegador: com cacheComponents, fica em Suspense. */}
        <Suspense fallback={<AuthFormSkeleton />}>
          <SignUp />
        </Suspense>
      </div>
    </PageShell>
  );
}
