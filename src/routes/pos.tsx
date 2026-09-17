import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { PosBoard } from "@/components/dashboard/PosBoard";
import { PosMobile } from "@/components/dashboard/PosMobile";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "POS — Baky Dessert House" },
      {
        name: "description",
        content:
          "Point of sale for Baky Dessert House — browse categories, pick items and variants, and build orders.",
      },
      { property: "og:title", content: "POS — Baky Dessert House" },
      {
        property: "og:description",
        content: "Browse categories, pick items and variants, and build orders.",
      },
    ],
  }),
  component: Pos,
});

function Pos() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
      <Sidebar />

      {/* Mobile: swipeable POS drawer */}
      <div className="flex flex-1 sm:hidden">
        <PosMobile />
      </div>

      {/* Desktop / tablet */}
      <div className="hidden h-full min-w-0 flex-1 flex-col overflow-hidden sm:flex">
        <Topbar title="POS" />

        <main className="flex flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
          <PosBoard />
        </main>
      </div>
    </div>
  );
}
