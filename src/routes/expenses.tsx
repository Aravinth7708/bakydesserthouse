import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { ExpensesBoard } from "@/components/dashboard/ExpensesBoard";
import { StaffRestrictedView } from "@/components/dashboard/StaffRestrictedView";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Manage Expenses — Baky Dessert House" },
      {
        name: "description",
        content:
          "Track expenses for Baky Dessert House — fuel, chocolates stock, water, utilities, and shop costs.",
      },
      { property: "og:title", content: "Manage Expenses — Baky Dessert House" },
      {
        property: "og:description",
        content: "Track fuel, stock, water, utilities, and operational expenses.",
      },
    ],
  }),
  component: Expenses,
});

function Expenses() {
  const { currentUser } = useStore();

  return (
    <AuthGuard>
      <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
        <Sidebar />

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title="Expenses" />

          <main className="flex flex-1 overflow-y-auto p-4 lg:p-6">
            {currentUser?.role === "Staff" ? (
              <StaffRestrictedView pageName="Expenses Management" />
            ) : (
              <ExpensesBoard />
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
