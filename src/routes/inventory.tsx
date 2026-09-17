import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { InventoryBoard } from "@/components/dashboard/InventoryBoard";
import { StaffRestrictedView } from "@/components/dashboard/StaffRestrictedView";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Manage Inventory — Baky Dessert House" },
      {
        name: "description",
        content:
          "Manage inventory for Baky Dessert House — track stock levels and low-stock items.",
      },
      { property: "og:title", content: "Manage Inventory — Baky Dessert House" },
      {
        property: "og:description",
        content: "Track stock levels and low-stock items.",
      },
    ],
  }),
  component: Inventory,
});

function Inventory() {
  const { currentUser } = useStore();

  return (
    <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
      <Sidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar title="Manage Inventory" />

        <main className="flex flex-1 overflow-y-auto p-4 lg:p-6">
          {currentUser?.role === "Staff" ? (
            <StaffRestrictedView pageName="Manage Inventory" />
          ) : (
            <InventoryBoard />
          )}
        </main>
      </div>
    </div>
  );
}
