import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { LoyaltyOperationsBoard } from "@/components/loyalty/LoyaltyOperationsBoard";

export const Route = createFileRoute("/loyalty-orders")({
  head: () => ({ meta: [{ title: "Loyalty Orders — Baky Dessert House" }] }),
  component: LoyaltyOrdersPage,
});

function LoyaltyOrdersPage() {
  return (
    <AuthGuard>
      <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title="Loyalty Orders" />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-3 sm:p-4 lg:p-6">
            <LoyaltyOperationsBoard />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
