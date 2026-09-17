import { useState } from "react";
import { useStore, type OrderStatus } from "@/lib/store";

const tabs: OrderStatus[] = ["New", "Preparing", "Served", "Past Orders"];

const nextLabel: Record<OrderStatus, string> = {
  New: "Start Preparing",
  Preparing: "Mark Served",
  Served: "Close Order",
  "Past Orders": "",
};

export function OrdersBoard() {
  const { orders, advanceOrder } = useStore();
  const [active, setActive] = useState<OrderStatus>("New");

  const visible = orders.filter((o) => o.status === active);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-6">
      {/* Tabs */}
      <div className="rounded-[15px] bg-baky-surface p-2 lg:p-[10px]">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:gap-2 lg:gap-2">
          {tabs.map((tab) => {
            const count = orders.filter((o) => o.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`flex h-9 items-center justify-center rounded-[29px] px-2 text-sm font-medium transition-colors md:h-12 md:px-3 md:text-base lg:h-16 lg:px-3 lg:text-2xl ${
                  active === tab
                    ? "bg-baky-card text-black"
                    : "text-black hover:bg-baky-card/50"
                }`}
              >
                {tab}
                {count > 0 && (
                  <span className="ml-1 text-xs text-[#1177E5] md:text-sm lg:ml-2 lg:text-lg">
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[15px] bg-baky-surface p-3 md:p-5 lg:p-6">
        <div className="min-w-0">
          <div className="grid grid-cols-[0.9fr_1.4fr_0.7fr_1fr] gap-2 border-b border-baky-muted/60 px-1 pb-2 text-[11px] text-baky-muted md:gap-3 md:pb-3 md:text-sm lg:gap-4 lg:px-2 lg:pb-3 lg:text-[17px]">
            <span>Order #</span>
            <span>Products</span>
            <span>Amount</span>
            <span>Action</span>
          </div>

          {visible.length === 0 ? (
            <p className="px-1 py-6 text-sm text-baky-muted md:py-7 md:text-base lg:px-2 lg:py-8 lg:text-xl">
              No orders here.
            </p>
          ) : (
            <ul>
              {visible.map((o) => (
                <li
                  key={o.id}
                  className="grid grid-cols-[0.9fr_1.4fr_0.7fr_1fr] items-center gap-2 px-1 py-3 text-xs font-medium text-black md:gap-3 md:py-4 md:text-base lg:gap-4 lg:px-2 lg:py-5 lg:text-xl"
                >
                  <span className="truncate">{o.id}</span>
                  <span className="truncate text-baky-muted">
                    {o.lines.map((l) => `${l.name} ×${l.qty}`).join(", ")}
                  </span>
                  <span>₹{o.total}</span>
                  <span>
                    {o.status !== "Past Orders" && (
                      <button
                        onClick={() => advanceOrder(o.id)}
                        className="text-left text-[11px] font-semibold leading-tight text-[#1177E5] md:text-sm lg:text-lg"
                      >
                        {nextLabel[o.status]}
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
