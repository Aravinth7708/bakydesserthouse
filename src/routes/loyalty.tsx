import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { StaffRestrictedView } from "@/components/dashboard/StaffRestrictedView";
import { LoyaltyAdminBoard } from "@/components/loyalty/LoyaltyAdminBoard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/loyalty")({
  head: () => ({
    meta: [
      { title: "Loyalty Program — Baky Dessert House" },
      { name: "description", content: "Manage loyalty customers, points, and brownie claims." },
    ],
  }),
  component: LoyaltyAdminPage,
});

function LoyaltyAdminPage() {
  const { currentUser } = useStore();
  return (
    <AuthGuard>
      <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title="Loyalty Program" />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-3 sm:p-4 lg:p-6">
            {currentUser?.role === "Staff" ? (
              <StaffRestrictedView pageName="Loyalty Program" />
            ) : (
              <LoyaltyAdminBoard />
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
