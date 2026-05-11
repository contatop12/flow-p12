import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <Suspense
        fallback={
          <div className="text-sm text-gray-400" aria-live="polite">
            Carregando…
          </div>
        }
      >
        <SignInForm />
      </Suspense>
    </div>
  );
}
