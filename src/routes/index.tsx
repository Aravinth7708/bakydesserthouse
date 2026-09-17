import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { SalesOverviewCard } from "@/components/dashboard/SalesOverviewCard";
import { TopSellingCard } from "@/components/dashboard/TopSellingCard";
import { StatCards } from "@/components/dashboard/StatCards";
import { RecentOrdersCard } from "@/components/dashboard/RecentOrdersCard";
import { LowInventoryCard } from "@/components/dashboard/LowInventoryCard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
      <Sidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />

        <main className="flex flex-1 flex-col overflow-y-auto space-y-4 p-4 pb-6 lg:space-y-6 lg:p-6 lg:pb-8">
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            <SalesOverviewCard />
            <TopSellingCard />
          </div>

          <StatCards />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[3fr_2fr] lg:gap-6">
            <RecentOrdersCard />
            <LowInventoryCard />
          </div>

          <div className="mt-auto pt-6">
            <h2 className="text-4xl font-semibold leading-tight text-baky-muted sm:text-5xl">
              The Home of <br className="sm:hidden" />
              Desserts <span className="text-[#F88484]">♥</span>
            </h2>
            <div className="mt-5 border-t border-baky-muted/60 pt-4">
              <span className="font-serif text-2xl font-bold italic text-baky-muted">
                Baky
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
