import { useCallback, useEffect, useState } from "react";
import { useStore, type OrderStatus, type Order, type OrderLine } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { CloseOrderModal } from "./CloseOrderModal";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { Trash2, Info, RefreshCw } from "lucide-react";

const tabs: OrderStatus[] = ["New", "Preparing", "Served", "Past Orders"];

const nextLabel: Record<OrderStatus, string> = {
  New: "Start Preparing",
  Preparing: "Mark Served",
  Served: "Close Order",
  "Past Orders": "",
};

const localDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function OrdersBoard() {
  const { currentUser, orders, advanceOrder, deleteOrder } = useStore();
  const isStaff = currentUser?.role === "Staff";
  const [active, setActive] = useState<OrderStatus>("New");
  const [ordersDateRange, setOrdersDateRange] = useState("Today");
  const [customStartDate, setCustomStartDate] = useState(() => localDateInput(new Date()));
  const [customEndDate, setCustomEndDate] = useState(() => localDateInput(new Date()));
  const [historyOrders, setHistoryOrders] = useState<Order[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [closingOrder, setClosingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const refreshHistory = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setHistoryOrders(orders.filter((order) => order.status === "Past Orders"));
      return;
    }

    setIsLoadingHistory(true);
    setHistoryError("");
    try {
      const rows: Array<Record<string, unknown>> = [];
      const pageSize = 1000;
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        rows.push(...((data || []) as Array<Record<string, unknown>>));
        if (!data || data.length < pageSize) break;
        offset += pageSize;
      }

      const remoteHistory: Order[] = rows
        .filter((row) => {
          const status = String(row.status || "")
            .trim()
            .toLowerCase();
          return (
            [
              "past orders",
              "past order",
              "completed",
              "complete",
              "closed",
              "paid",
              "done",
            ].includes(status) || Boolean(row.payment_method || row.paymentMethod)
          );
        })
        .map((row) => ({
          id: String(row.id),
          lines: Array.isArray(row.lines) ? (row.lines as OrderLine[]) : [],
          total: Number(row.total || 0),
          status: "Past Orders",
          orderSource: String(row.order_source || "Shop"),
          customerName: row.customer_name ? String(row.customer_name) : undefined,
          customerPhone: row.customer_phone ? String(row.customer_phone) : undefined,
          fulfillmentType: row.fulfillment_type ? String(row.fulfillment_type) : undefined,
          takeawayFee: Number(row.takeaway_fee || 0),
          paymentMethod:
            row.payment_method || row.paymentMethod
              ? String(row.payment_method || row.paymentMethod)
              : undefined,
          paymentDetails:
            row.payment_details || row.paymentDetails
              ? String(row.payment_details || row.paymentDetails)
              : undefined,
          createdAt: String(row.created_at || new Date().toISOString()),
        }));

      const merged = new Map<string, Order>();
      orders
        .filter((order) => order.status === "Past Orders")
        .forEach((order) => merged.set(order.id, order));
      remoteHistory.forEach((order) => merged.set(order.id, order));
      setHistoryOrders([...merged.values()]);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Could not refresh past orders.");
      setHistoryOrders(
        (current) => current ?? orders.filter((order) => order.status === "Past Orders"),
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, [orders]);

  useEffect(() => {
    if (active === "Past Orders") void refreshHistory();
  }, [active, refreshHistory]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const matchesDateRange = (order: Order) => {
    const selectedRange = isStaff ? "Today" : ordersDateRange;
    if (selectedRange === "All time") return true;
    const createdAt = new Date(order.createdAt).getTime();
    if (!Number.isFinite(createdAt)) return false;
    if (selectedRange === "Today")
      return createdAt >= today.getTime() && createdAt < tomorrow.getTime();
    if (selectedRange === "Yesterday")
      return createdAt >= yesterday.getTime() && createdAt < today.getTime();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    if (selectedRange === "Last 7 days") return createdAt >= sevenDaysAgo.getTime();
    if (selectedRange === "Last 30 days") return createdAt >= thirtyDaysAgo.getTime();
    if (selectedRange === "Custom range") {
      const start = new Date(`${customStartDate}T00:00:00`).getTime();
      const end = new Date(`${customEndDate}T00:00:00`);
      end.setDate(end.getDate() + 1);
      return createdAt >= start && createdAt < end.getTime();
    }
    return true;
  };

  const sourceOrders = active === "Past Orders" && historyOrders ? historyOrders : orders;
  const visible = sourceOrders
    .filter((order) => order.status === active && matchesDateRange(order))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
        {isStaff ? (
          <p className="mb-2 px-1 text-xs font-semibold text-baky-muted sm:mb-3">
            Showing today’s orders · {today.toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </p>
        ) : (
          <div className="mb-2 flex flex-wrap items-end gap-2 px-1 sm:mb-3">
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-baky-muted sm:text-xs">
              Order date
              <select
                value={ordersDateRange}
                onChange={(event) => setOrdersDateRange(event.target.value)}
                className="h-10 min-w-36 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-gray-800 outline-none focus:border-[#1177E5]"
              >
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>All time</option>
                <option>Custom range</option>
              </select>
            </label>
            {ordersDateRange === "Custom range" && (
              <>
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-baky-muted sm:text-xs">
                  From
                  <input
                    type="date"
                    value={customStartDate}
                    max={customEndDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="h-10 rounded-xl border border-black/10 bg-white px-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#1177E5]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-baky-muted sm:text-xs">
                  To
                  <input
                    type="date"
                    value={customEndDate}
                    min={customStartDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="h-10 rounded-xl border border-black/10 bg-white px-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#1177E5]"
                  />
                </label>
              </>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-1.5 sm:grid-cols-4 md:gap-2 lg:gap-2">
            {tabs.map((tab) => {
              const tabOrders = tab === "Past Orders" && historyOrders ? historyOrders : orders;
              const count = tabOrders.filter(
                (order) => order.status === tab && matchesDateRange(order),
              ).length;
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
        </div>
      </div>

      {/* Table / List Container */}
      <div className="rounded-[15px] bg-baky-surface p-3 md:p-5 lg:p-6">
        {active === "Past Orders" && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-baky-muted sm:text-sm">
                Completed order history · {visible.length} shown
              </p>
              <button
                onClick={() => void refreshHistory()}
                disabled={isLoadingHistory}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 text-xs font-bold text-gray-700 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        )}
        {active === "Past Orders" && historyError && (
          <p role="alert" className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
            Could not refresh from the database. Showing saved orders where available.{" "}
            {historyError}
          </p>
        )}
        <div className="min-w-0">
          <div className="grid grid-cols-4 gap-2 border-b border-baky-muted/60 px-1 pb-2 text-xs text-baky-muted font-semibold md:gap-3 md:pb-3 md:text-sm lg:gap-4 lg:px-2 lg:pb-3 lg:text-[17px]">
            <span>Order #</span>
            <span>Products</span>
            <span>Amount</span>
            <span className="text-right sm:text-left">
              {active === "Past Orders" ? "Payment" : "Action"}
            </span>
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
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-gray-900">{o.id}</span>
                      <button
                        type="button"
                        onClick={() => setViewingOrder(o)}
                        className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-blue-50 hover:text-[#1177E5]"
                        title={`View details for order ${o.id}`}
                      >
                        <Info className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </button>
                    </div>
                    {o.status === "Past Orders" && (
                      <p className="mt-0.5 text-[9px] text-gray-500 sm:text-[10px]">
                        {new Date(o.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    )}
                    {o.orderSource === "Loyalty" && (
                      <p className="mt-0.5 truncate text-[9px] font-semibold text-[#31572e] sm:text-[10px]">
                        {o.customerName || "Loyalty customer"}
                        {o.fulfillmentType ? ` · ${o.fulfillmentType}` : ""}
                      </p>
                    )}
                  </div>
                  <span
                    className="truncate text-baky-muted cursor-pointer hover:text-gray-900 transition-colors"
                    title={o.lines
                      .map((l) => `${l.name}${l.variant ? ` (${l.variant})` : ""} ×${l.qty}`)
                      .join(", ")}
                    onClick={() => setViewingOrder(o)}
                  >
                    {o.lines
                      .map((l) => `${l.name}${l.variant ? ` (${l.variant})` : ""} ×${l.qty}`)
                      .join(", ")}
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
      <CloseOrderModal order={closingOrder} onClose={() => setClosingOrder(null)} />

      {/* Full Order Details Modal */}
      <OrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
    </div>
  );
}
