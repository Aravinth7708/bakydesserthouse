import { useState } from "react";
import { useStore, type OrderStatus, type Order } from "@/lib/store";
import { CloseOrderModal } from "./CloseOrderModal";
import { Trash2 } from "lucide-react";

const tabs: OrderStatus[] = ["New", "Preparing", "Served", "Past Orders"];

const nextLabel: Record<OrderStatus, string> = {
  New: "Start Preparing",
  Preparing: "Mark Served",
  Served: "Close Order",
  "Past Orders": "",
};

export function OrdersBoard() {
  const { orders, advanceOrder, deleteOrder, clearAllOrders, currentUser } = useStore();
  const [active, setActive] = useState<OrderStatus>("New");
  const [closingOrder, setClosingOrder] = useState<Order | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const visible = orders.filter((o) => o.status === active);

  const handleActionClick = (order: Order) => {
    if (order.status === "Served") {
      setClosingOrder(order);
    } else {
      advanceOrder(order.id);
    }
  };

  const renderPaymentBadge = (order: Order) => {
    if (!order.paymentMethod) {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 md:text-xs">
          Completed
        </span>
      );
    }

    switch (order.paymentMethod) {
      case "Cash":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 md:text-xs">
            💵 Cash
          </span>
        );
      case "GPay":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200 md:text-xs">
            📱 GPay
          </span>
        );
      case "Online Orders":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200 md:text-xs">
            🌐 Online
          </span>
        );
      case "Split Payment":
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 border border-indigo-200 md:text-xs max-w-full truncate"
            title={order.paymentDetails || "Split Payment"}
          >
            🔀 Split ({order.paymentDetails || "Cash + GPay"})
          </span>
        );
      case "Nil":
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-300 md:text-xs"
            title="Item delivered - Payment not received"
          >
            ⚠️ Nil (Unpaid)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-800 md:text-xs">
            {order.paymentMethod}
          </span>
        );
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear ALL orders? This will delete all active and past orders.")) {
      setIsClearing(true);
      try {
        await clearAllOrders();
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleDeleteSingle = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (window.confirm(`Delete order ${orderId}?`)) {
      await deleteOrder(orderId);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-6">
      {/* Tabs & Controls */}
      <div className="rounded-[15px] bg-baky-surface p-2 lg:p-[10px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-1.5 sm:grid-cols-4 md:gap-2 lg:gap-2">
            {tabs.map((tab) => {
              const count = orders.filter((o) => o.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActive(tab)}
                  className={`flex h-10 items-center justify-center rounded-[29px] px-2 text-xs font-semibold transition-colors sm:text-sm md:h-12 md:px-3 md:text-base lg:h-16 lg:px-3 lg:text-2xl ${
                    active === tab
                      ? "bg-baky-card text-black shadow-sm"
                      : "text-black hover:bg-baky-card/50"
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span className="ml-1 text-xs font-bold text-[#1177E5] md:text-sm lg:ml-2 lg:text-lg">
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {orders.length > 0 && (
            <div className="flex justify-end px-1 sm:px-2">
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                title="Wipe all orders from database and store"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isClearing ? "Clearing..." : "Clear All Orders"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table / List Container */}
      <div className="rounded-[15px] bg-baky-surface p-3 md:p-5 lg:p-6">
        <div className="min-w-0">
          <div className="grid grid-cols-4 gap-2 border-b border-baky-muted/60 px-1 pb-2 text-xs text-baky-muted font-semibold md:gap-3 md:pb-3 md:text-sm lg:gap-4 lg:px-2 lg:pb-3 lg:text-[17px]">
            <span>Order #</span>
            <span>Products</span>
            <span>Amount</span>
            <span className="text-right sm:text-left">{active === "Past Orders" ? "Payment" : "Action"}</span>
          </div>

          {visible.length === 0 ? (
            <p className="px-1 py-6 text-sm text-baky-muted md:py-7 md:text-base lg:px-2 lg:py-8 lg:text-xl">
              No orders here.
            </p>
          ) : (
            <ul className="divide-y divide-baky-muted/20">
              {visible.map((o) => (
                <li
                  key={o.id}
                  className="grid grid-cols-4 items-center gap-2 px-1 py-3 text-xs font-medium text-black md:gap-3 md:py-4 md:text-base lg:gap-4 lg:px-2 lg:py-5 lg:text-xl"
                >
                  <span className="truncate font-semibold text-gray-900">{o.id}</span>
                  <span className="truncate text-baky-muted" title={o.lines.map((l) => `${l.name} ×${l.qty}`).join(", ")}>
                    {o.lines.map((l) => `${l.name} ×${l.qty}`).join(", ")}
                  </span>
                  <span className="font-bold text-gray-900">₹{o.total}</span>
                  <div className="flex items-center justify-end sm:justify-start gap-2 min-w-0">
                    {o.status === "Past Orders" ? (
                      renderPaymentBadge(o)
                    ) : (
                      <button
                        onClick={() => handleActionClick(o)}
                        className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-bold leading-tight transition-all sm:text-sm md:text-base ${
                          o.status === "Served"
                            ? "bg-[#1177E5] text-white hover:bg-blue-600 shadow-sm active:scale-95"
                            : "text-[#1177E5] hover:underline"
                        }`}
                      >
                        {nextLabel[o.status]}
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteSingle(e, o.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title={`Delete order ${o.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Payment Selection Modal */}
      <CloseOrderModal
        order={closingOrder}
        onClose={() => setClosingOrder(null)}
      />
    </div>
  );
}
