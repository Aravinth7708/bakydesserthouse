import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { ExpensesBoard } from "@/components/dashboard/ExpensesBoard";
import { AuthGuard } from "@/components/auth/AuthGuard";

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
  return (
    <AuthGuard>
      <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
        <Sidebar />

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title="Expenses" />

          <main className="flex flex-1 flex-col min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6">
            <ExpensesBoard />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
