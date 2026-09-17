import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { OrdersBoard } from "@/components/dashboard/OrdersBoard";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Manage Orders — Baky Dessert House" },
      {
        name: "description",
        content:
          "Manage orders for Baky Dessert House — track new, preparing, served, and past orders.",
      },
      { property: "og:title", content: "Manage Orders — Baky Dessert House" },
      {
        property: "og:description",
        content: "Track new, preparing, served, and past orders.",
      },
    ],
  }),
  component: Orders,
});

function Orders() {
  return (
    <AuthGuard>
      <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
        <Sidebar />

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title="Manage Orders" />

          <main className="flex flex-1 overflow-y-auto p-4 lg:p-6">
            <OrdersBoard />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
