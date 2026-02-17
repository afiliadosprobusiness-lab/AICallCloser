import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(229,199,107,0.16),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(111,168,255,0.12),transparent_38%)]" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#E5C76B]/30 bg-[#111111]/80 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="mb-6 block text-center">
          <h1 className="font-serif text-3xl text-[#F5F3EE]">AI Call Closer</h1>
          <p className="mt-1 text-sm text-[#C9C5BB]">Premium SaaS para closers de alto rendimiento</p>
        </Link>
        {children}
      </div>
    </div>
  );
}
