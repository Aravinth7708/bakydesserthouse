import { createFileRoute } from "@tanstack/react-router";
import { CustomerLoyaltyBoard } from "@/components/loyalty/CustomerLoyaltyBoard";

export const Route = createFileRoute("/customer")({
  head: () => ({
    meta: [
      { title: "Order & Rewards — Baky Dessert House" },
      {
        name: "description",
        content: "Order your favourite desserts and collect Baky loyalty rewards.",
      },
      { name: "theme-color", content: "#213a20" },
    ],
  }),
  component: CustomerPage,
});

function CustomerPage() {
  // The app shell locks body scrolling for dashboard screens. Give the public
  // customer flow its own viewport-sized scroll container so mobile browsers
  // can reach the complete menu, cart, and rewards content.
  return (
    <div className="h-[100dvh] w-full touch-pan-y overflow-x-hidden overflow-y-auto overscroll-y-contain">
      <CustomerLoyaltyBoard />
    </div>
  );
}
