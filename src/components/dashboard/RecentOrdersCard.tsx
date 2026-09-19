import { useState } from "react";
import { useStore, type Order } from "@/lib/store";
import { Info } from "lucide-react";
import { OrderDetailsModal } from "./OrderDetailsModal";

export function RecentOrdersCard() {
  const { orders } = useStore();
  const recent = orders.slice(0, 4);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Served":
        return "bg-[#65B54E]/20 text-[#2d6e19]";
      case "Preparing":
        return "bg-amber-100 text-amber-800";
      case "New":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="rounded-[10px] bg-baky-card p-4 md:p-6 lg:rounded-[15px] lg:p-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-baky-muted md:text-base lg:text-xl">
          Recent Orders
        </p>
        <span className="text-[10px] text-baky-muted md:text-sm">
          {orders.length} total
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 border-b border-baky-muted/60 pb-3 text-[10px] font-normal text-baky-muted md:text-sm lg:mt-6 lg:text-[17px]">
        <span>Order #</span>
        <span>Product</span>
        <span>Amount</span>
        <span className="text-right">Status</span>
      </div>

      {recent.length === 0 ? (
        <div className="flex h-20 items-center justify-center text-xs text-baky-muted md:text-sm">
          No orders yet. Place an order in POS to see it here!
        </div>
      ) : (
        <ul className="divide-y divide-baky-muted/20">
          {recent.map((o) => {
            const productSummary = o.lines
              .map((l) => `${l.qty}x ${l.name}${l.variant ? ` (${l.variant})` : ""}`)
              .join(", ");
            const isHovered = hoveredOrderId === o.id;

            return (
              <li
                key={o.id}
                className="grid grid-cols-4 items-center py-2.5 text-xs text-black md:py-3 md:text-sm lg:text-base relative"
              >
                {/* Order ID + Info Icon */}
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span className="font-semibold text-black truncate">{o.id}</span>
                  <div className="relative inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(o)}
                      onMouseEnter={() => setHoveredOrderId(o.id)}
                      onMouseLeave={() => setHoveredOrderId(null)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-blue-50 hover:text-[#1177E5] transition-colors focus:outline-none shrink-0"
                      title="Click or hover to view order details"
                      aria-label={`View details for order ${o.id}`}
                    >
                      <Info className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                    </button>

                    {/* Responsive Hover Popover Card for Desktop */}
                    {isHovered && (
                      <div className="hidden sm:block absolute left-full top-1/2 -translate-y-1/2 ml-2 z-40 w-64 rounded-xl bg-white p-3 shadow-xl border border-gray-200 text-xs animate-in fade-in duration-150 pointer-events-none">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-2">
                          <span className="font-bold text-gray-900">{o.id} Details</span>
                          <span className="text-[10px] font-semibold text-[#1177E5]">
                            {o.lines.reduce((s, l) => s + l.qty, 0)} items
                          </span>
                        </div>
                        <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {o.lines.map((l, idx) => (
                            <li key={idx} className="flex justify-between items-center text-[11px]">
                              <span className="truncate text-gray-700 font-medium max-w-[140px]">
                                {l.qty}× {l.name}
                                {l.variant && <span className="text-gray-400"> ({l.variant})</span>}
                              </span>
                              <span className="font-semibold text-gray-900 ml-1">₹{l.qty * l.price}</span>
                            </li>
                          ))}
                        </ul>
                        {o.paymentMethod && (
                          <div className="mt-2 pt-1.5 border-t border-gray-100 text-[10px] text-gray-500 font-medium">
                            Payment: <span className="font-semibold text-gray-800">{o.paymentMethod}</span>
                          </div>
                        )}
                        <p className="mt-1.5 text-[9px] text-[#1177E5] font-semibold italic">
                          Click icon for full view
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Summary */}
                <span
                  className="truncate pr-2 text-black/80 cursor-pointer hover:text-blue-600 transition-colors"
                  title={productSummary}
                  onClick={() => setSelectedOrder(o)}
                >
                  {productSummary}
                </span>

                {/* Total */}
                <span className="font-medium text-black">₹{o.total}</span>

                {/* Status */}
                <div className="text-right">
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium md:text-xs transition-opacity hover:opacity-80 ${getStatusStyle(
                      o.status,
                    )}`}
                  >
                    {o.status}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Full Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
