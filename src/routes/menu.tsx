import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { MenuBoard } from "@/components/dashboard/MenuBoard";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Manage Menu — Baky Dessert House" },
      {
        name: "description",
        content:
          "Manage the menu for Baky Dessert House — categories, items, variants and availability.",
      },
      { property: "og:title", content: "Manage Menu — Baky Dessert House" },
      {
        property: "og:description",
        content: "Categories, items, variants and availability.",
      },
    ],
  }),
  component: Menu,
});

function Menu() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
      <Sidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar title="Manage Menu" />

        <main className="flex flex-1 overflow-y-auto p-4 lg:p-6">
          <MenuBoard />
        </main>
      </div>
    </div>
  );
}
