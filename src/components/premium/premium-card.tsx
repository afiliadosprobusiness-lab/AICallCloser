import { cn } from "@/lib/utils";

export function PremiumCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "premium-glass gold-sheen premium-hover rounded-3xl border border-[#E5C76B]/25 p-4 md:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
