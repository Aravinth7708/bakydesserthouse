import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SalarySettlementBoard } from "@/components/dashboard/SalarySettlementBoard";
import { StaffRestrictedView } from "@/components/dashboard/StaffRestrictedView";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/salary-settlement")({
  head: () => ({
    meta: [
      { title: "Salary Settlement — Baky Dessert House" },
      {
        name: "description",
        content: "Track staff salary, advances, and monthly settlements.",
      },
    ],
  }),
  component: SalarySettlementPage,
});

function SalarySettlementPage() {
  const { currentUser } = useStore();

  return (
    <AuthGuard>
      <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title="Salary Settlement" />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-3 text-black sm:p-4 lg:p-6">
            {currentUser?.role === "Staff" ? (
              <StaffRestrictedView pageName="Salary Settlement" />
            ) : (
              <SalarySettlementBoard />
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
