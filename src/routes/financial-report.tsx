import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { FinancialReportBoard } from "@/components/dashboard/FinancialReportBoard";
import { StaffRestrictedView } from "@/components/dashboard/StaffRestrictedView";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/financial-report")({
  head: () => ({
    meta: [
      { title: "Financial Report — Baky Dessert House" },
      {
        name: "description",
        content: "Review revenue, payment methods, expenses, and monthly net balance.",
      },
    ],
  }),
  component: FinancialReport,
});

function FinancialReport() {
  const { currentUser } = useStore();
  return (
    <AuthGuard>
      <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title="Financial Report" />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-3 text-black sm:p-4 lg:p-6">
            {currentUser?.role === "Staff" ? (
              <StaffRestrictedView pageName="Financial Report" />
            ) : (
              <FinancialReportBoard />
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
