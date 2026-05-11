import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-[#18181B]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold tracking-widest">F</span>
          </div>
          <span className="text-white/60 text-sm font-medium">Flow P12</span>
        </div>

        <div className="space-y-6">
          <p className="text-white/20 text-xs font-medium uppercase tracking-[0.2em]">
            AI Brand Studio
          </p>
          <h2 className="text-white text-3xl font-light leading-relaxed">
            Identidade visual<br />
            como nó conectável.
          </h2>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-white/40 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16]" />
              Text
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/40 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
              Brand ID
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/40 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              Layout
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/40 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
              Output
            </span>
          </div>
        </div>

        <p className="text-white/20 text-xs">© 2026 P12 Digital</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center p-8 bg-bg">
        <Suspense
          fallback={
            <div className="text-sm text-muted" aria-live="polite">
              Carregando…
            </div>
          }
        >
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
