import { PremiumCard } from "@/components/premium/premium-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="space-y-3 p-5 md:p-6">
        <Skeleton className="h-3 w-24 bg-white/10" />
        <Skeleton className="h-10 w-3/4 bg-white/10" />
        <Skeleton className="h-4 w-full bg-white/10" />
      </PremiumCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <PremiumCard key={index} className="space-y-3 p-4 md:p-5">
            <Skeleton className="h-3 w-20 bg-white/10" />
            <Skeleton className="h-8 w-16 bg-white/10" />
          </PremiumCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PremiumCard className="space-y-3 p-4 md:p-5">
          <Skeleton className="h-5 w-44 bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
        </PremiumCard>

        <PremiumCard className="space-y-3 p-4 md:p-5">
          <Skeleton className="h-5 w-36 bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-2/3 bg-white/10" />
        </PremiumCard>
      </div>
    </div>
  );
}
