import LoginForm from "../../features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* 1. Background Pattern (Dot Grid) */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]"></div>

      {/* 2. Content Wrapper */}
      <div className="relative z-10 w-full max-w-md px-4 space-y-8">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-xl shadow-lg dark:bg-white dark:text-black">
            Q
          </div>
          <h1 className="text-2xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-50">
            QuizNow
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Professional Exam Preparation Platform
          </p>
        </div>

        {/* The Form Component */}
        <LoginForm />

        {/* Footer Links */}
        <p className="px-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          By clicking continue, you agree to our{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
