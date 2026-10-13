import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthFormSkeleton } from "@/components/layout/AuthFormSkeleton";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Login",
};

/** Login do Clerk (e-mail/senha ou GitHub). Respeita `?redirect_url=`. */
export default function SignInPage() {
  return (
    <PageShell>
      <div className="flex justify-center py-12">
        {/* O formulário lê a URL no navegador: com cacheComponents, fica em Suspense. */}
        <Suspense fallback={<AuthFormSkeleton />}>
          <SignIn />
        </Suspense>
      </div>
    </PageShell>
  );
}
