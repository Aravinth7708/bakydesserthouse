import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { ManageBoard } from "@/components/dashboard/ManageBoard";

export const Route = createFileRoute("/manage")({
  head: () => ({
    meta: [
      { title: "Manage Baky — Baky Dessert House" },
      {
        name: "description",
        content:
          "Manage Baky Dessert House — administer staff, roles, and outlet-level information.",
      },
      { property: "og:title", content: "Manage Baky — Baky Dessert House" },
      {
        property: "og:description",
        content: "Administer staff, roles, and outlet-level information.",
      },
    ],
  }),
  component: Manage,
});

function Manage() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
      <Sidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar title="Manage Baky" />

        <main className="flex flex-1 overflow-y-auto p-4 lg:p-6">
          <ManageBoard />
        </main>
      </div>
    </div>
  );
}
