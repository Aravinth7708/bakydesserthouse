import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock3,
  Copy,
  LoaderCircle,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  loadLoyaltyOperations,
  updateLoyaltyClaim,
  updateLoyaltyOrder,
  type LoyaltyClaim,
  type LoyaltyCustomer,
  type LoyaltyOrder,
} from "@/lib/loyalty";

const money = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;
type OperationData = {
  orders: LoyaltyOrder[];
  customers: LoyaltyCustomer[];
  claims: LoyaltyClaim[];
};

export function LoyaltyOperationsBoard() {
  const { currentUser } = useStore();
  const [data, setData] = useState<OperationData>({ orders: [], customers: [], claims: [] });
  const [view, setView] = useState<"orders" | "claims">("orders");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [copiedCustomerLink, setCopiedCustomerLink] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );
  const knownOrderIds = useRef(new Set<string>());
  const initialOrdersLoaded = useRef(false);
  const customerLink =
    typeof window === "undefined" ? "/customer" : `${window.location.origin}/customer`;

  const notifyNewOrder = useCallback(async (order: LoyaltyOrder) => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    )
      return;
    const customerName = order.customer_name || "A customer";
    const itemCount = order.items.reduce((total, item) => total + item.qty, 0);
    const title = "New customer order";
    const body = `${customerName} sent an order with ${itemCount} ${itemCount === 1 ? "item" : "items"} · ${money(order.total)}`;
    try {
      const registration =
        "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
      if (registration) {
        await registration.showNotification(title, {
          body,
          icon: "/baky-logo.png",
          badge: "/baky-logo.png",
          tag: `loyalty-new-order-${order.id}`,
          data: { url: "/loyalty-orders" },
        });
      } else {
        new Notification(title, { body, tag: `loyalty-new-order-${order.id}` });
      }
    } catch (notificationError) {
      console.warn("Could not show a staff order notification", notificationError);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await loadLoyaltyOperations();
      if (!initialOrdersLoaded.current) {
        next.orders.forEach((order) => knownOrderIds.current.add(order.id));
        initialOrdersLoaded.current = true;
      } else {
        const incomingOrders = next.orders.filter(
          (order) => !knownOrderIds.current.has(order.id) && order.status !== "Cancelled",
        );
        next.orders.forEach((order) => knownOrderIds.current.add(order.id));
        incomingOrders.forEach((order) => void notifyNewOrder(order));
      }
      setData(next);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load loyalty orders.");
    } finally {
      setIsLoading(false);
    }
  }, [notifyNewOrder]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20000);
    const channel = supabase
      ?.channel("staff-loyalty-new-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "loyalty_orders" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      window.clearInterval(timer);
      if (channel) void supabase?.removeChannel(channel);
    };
  }, [refresh]);

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (permissionError) {
      console.warn("Could not request staff notification permission", permissionError);
      setNotificationPermission(Notification.permission);
    }
  };

  const copyCustomerLink = async () => {
    try {
      await navigator.clipboard.writeText(customerLink);
      setCopiedCustomerLink(true);
      window.setTimeout(() => setCopiedCustomerLink(false), 1800);
    } catch {
      setError("Could not copy the customer link. Please copy it from the QR card.");
    }
  };

  const customerById = useMemo(
    () => new Map(data.customers.map((customer) => [customer.id, customer])),
    [data.customers],
  );
  const newOrders = data.orders.filter((order) => order.status === "New");
  const activeOrders = data.orders.filter(
    (order) => order.status === "Preparing" || order.status === "Ready",
  );
  const pendingClaims = data.claims.filter((claim) => claim.status === "Pending");

  const advance = async (order: LoyaltyOrder, status: LoyaltyOrder["status"]) => {
    setBusyId(order.id);
    setError("");
    try {
      const result = await updateLoyaltyOrder(
        order,
        status,
        currentUser?.staffMember?.name || "Shop staff",
      );
      await refresh();
      if (status === "Preparing" && typeof result === "string") {
        window.alert(`Customer confirmed. Order ${result} is now in Orders → Preparing.`);
      }
      if (status === "Completed") {
        window.alert(
          Number(result) > 0
            ? `Order completed. ${result} loyalty point${result === 1 ? "" : "s"} added.`
            : "Order completed. No full ₹100 spend unit was earned yet.",
        );
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update this order.");
    } finally {
      setBusyId("");
    }
  };

  const redeem = async (claim: LoyaltyClaim) => {
    setBusyId(claim.id);
    setError("");
    try {
      await updateLoyaltyClaim(claim.id, currentUser?.staffMember?.name || "Shop staff");
      await refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Could not redeem this brownie claim.",
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-6 sm:gap-5">
      <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-baky-muted">
              Staff Portal
            </p>
            <h2 className="mt-1 text-xl font-bold text-black sm:text-2xl">
              Customer orders & rewards
            </h2>
            <p className="mt-1 text-sm text-baky-muted">
              Confirm the customer in person, prepare orders, and redeem brownie claims.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void enableNotifications()}
              disabled={
                notificationPermission === "unsupported" || notificationPermission === "granted"
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-default disabled:opacity-70"
              aria-label="Enable new customer order notifications"
              title={
                notificationPermission === "denied"
                  ? "Allow notifications in your browser settings"
                  : undefined
              }
            >
              <Bell className="h-4 w-4" />
              {notificationPermission === "granted"
                ? "Alerts on"
                : notificationPermission === "denied"
                  ? "Alerts blocked"
                  : notificationPermission === "unsupported"
                    ? "Alerts unavailable"
                    : "Enable order alerts"}
            </button>
            <button
              onClick={() => void refresh()}
              className="flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
              aria-label="Refresh orders"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <SmallStat label="New orders" value={newOrders.length} tone="blue" />
          <SmallStat label="In preparation" value={activeOrders.length} tone="amber" />
          <SmallStat label="Pending brownie claims" value={pendingClaims.length} tone="green" />
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-black/5 bg-baky-surface p-4 sm:flex-row sm:justify-between sm:p-5">
        <div className="min-w-0 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <QrCode className="h-5 w-5 text-[#31572e]" />
            <h3 className="text-base font-bold text-black">Customer loyalty QR</h3>
          </div>
          <p className="mt-1 text-sm text-baky-muted">
            Let customers scan to open the menu, place an order, and earn rewards.
          </p>
          <p className="mt-2 break-all text-xs font-medium text-gray-700">{customerLink}</p>
          <button
            onClick={() => void copyCustomerLink()}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#213a20] px-4 text-xs font-bold text-white hover:bg-[#31572e]"
          >
            <Copy className="h-4 w-4" /> {copiedCustomerLink ? "Link copied" : "Copy customer link"}
          </button>
        </div>
        <div className="shrink-0 rounded-2xl bg-white p-3 shadow-sm">
          <QRCodeSVG
            value={customerLink}
            size={144}
            level="H"
            includeMargin
            aria-label="Customer loyalty QR code"
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-baky-surface p-1.5">
        <button
          onClick={() => setView("orders")}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold sm:text-sm ${view === "orders" ? "bg-white text-black shadow-sm" : "text-gray-600"}`}
        >
          <ShoppingBag className="h-4 w-4" /> Orders ({newOrders.length + activeOrders.length})
        </button>
        <button
          onClick={() => setView("claims")}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold sm:text-sm ${view === "claims" ? "bg-white text-black shadow-sm" : "text-gray-600"}`}
        >
          <CheckCheck className="h-4 w-4" /> Brownie claims ({pendingClaims.length})
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800"
        >
          {error}
        </p>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-baky-surface py-16 text-sm text-baky-muted">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Loading loyalty activity...
        </div>
      ) : view === "orders" ? (
        <div className="space-y-4">
          <OrderSection
            title="New requests"
            orders={newOrders}
            customerById={customerById}
            busyId={busyId}
            onAdvance={advance}
          />
          <OrderSection
            title="Being prepared"
            orders={activeOrders}
            customerById={customerById}
            busyId={busyId}
            onAdvance={advance}
          />
          {newOrders.length + activeOrders.length === 0 && (
            <EmptyState text="No customer orders are waiting right now." />
          )}
        </div>
      ) : (
        <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
          <h3 className="text-base font-bold text-black sm:text-lg">Free brownie claims</h3>
          <p className="mt-1 text-xs text-baky-muted">
            Check the customer and claim code, then mark the brownie as handed over.
          </p>
          {pendingClaims.length === 0 ? (
            <EmptyState text="No brownie claims are waiting to be redeemed." />
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {pendingClaims.map((claim) => {
                const customer = customerById.get(claim.customer_id);
                return (
                  <article
                    key={claim.id}
                    className="rounded-2xl border border-amber-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-gray-900">{claim.reward_name}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Claim {claim.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900">
                        Pending
                      </span>
                    </div>
                    <CustomerIdentity
                      name={customer?.name || "Customer"}
                      phone={customer?.phone || ""}
                    />
                    <button
                      onClick={() => void redeem(claim)}
                      disabled={busyId === claim.id}
                      className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#31572e] px-3 text-sm font-bold text-white hover:bg-[#254624] disabled:opacity-50"
                    >
                      {busyId === claim.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCheck className="h-4 w-4" />
                      )}
                      Confirm & redeem brownie
                    </button>
                  </article>
                );
              })}
            </div>
          )}
          <div className="mt-5 border-t border-black/10 pt-4">
            <h4 className="text-sm font-bold text-gray-800">Recently redeemed</h4>
            {data.claims
              .filter((claim) => claim.status === "Redeemed")
              .slice(0, 6)
              .map((claim) => {
                const customer = customerById.get(claim.customer_id);
                return (
                  <div
                    key={claim.id}
                    className="flex flex-wrap justify-between gap-2 border-b border-black/5 py-2 text-xs"
                  >
                    <span className="font-semibold">
                      {customer?.name || "Customer"} · {claim.reward_name}
                    </span>
                    <span className="text-baky-muted">
                      {claim.redeemed_at
                        ? new Date(claim.redeemed_at).toLocaleDateString("en-IN")
                        : "Redeemed"}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderSection({
  title,
  orders,
  customerById,
  busyId,
  onAdvance,
}: {
  title: string;
  orders: LoyaltyOrder[];
  customerById: Map<string, LoyaltyCustomer>;
  busyId: string;
  onAdvance: (order: LoyaltyOrder, status: LoyaltyOrder["status"]) => Promise<void>;
}) {
  if (!orders.length) return null;
  return (
    <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
      <h3 className="mb-3 text-base font-bold text-black sm:text-lg">{title}</h3>
      <div className="grid gap-3 lg:grid-cols-2">
        {orders.map((order) => {
          const customer = customerById.get(order.customer_id);
          return (
            <article
              key={order.id}
              className="min-w-0 rounded-2xl border border-black/5 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">
                    Order {order.shop_order_id || `#${order.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {new Date(order.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${order.status === "New" ? "bg-blue-50 text-blue-800" : order.status === "Ready" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}
                >
                  {order.status === "Ready" ? "Served" : order.status}
                </span>
              </div>
              <CustomerIdentity
                name={customer?.name || order.customer_name}
                phone={customer?.phone || order.customer_phone}
              />
              <p className="mt-2 text-xs font-bold text-[#31572e]">
                {order.fulfillment_type === "Takeaway" ? "Takeaway" : "Dine in"}
                {Number(order.takeaway_fee) > 0
                  ? ` · ${money(Number(order.takeaway_fee))} takeaway charge`
                  : ""}
              </p>
              {order.verified_by && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified by {order.verified_by}
                </p>
              )}
              <div className="mt-3 space-y-1.5 rounded-xl bg-[#f8f8f6] p-3">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.itemId}-${item.variant || ""}-${index}`}
                    className="flex justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 truncate text-gray-700">
                      {item.name}
                      {item.variant ? ` · ${item.variant}` : ""} ×{item.qty}
                    </span>
                    <span className="shrink-0 font-semibold text-gray-900">
                      {money(item.price * item.qty)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-extrabold">
                  <span>Total</span>
                  <span>{money(Number(order.total))}</span>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
                After collecting payment, complete the order to award 1 point per cumulative ₹100
                spent.
              </p>
              {order.status === "New" ? (
                <button
                  onClick={() => void onAdvance(order, "Preparing")}
                  disabled={busyId === order.id}
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#31572e] px-3 text-xs font-bold text-white transition hover:bg-[#254624] disabled:opacity-50 sm:text-sm"
                >
                  {busyId === order.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Clock3 className="h-4 w-4" />
                  )}
                  Confirm customer & start preparing
                </button>
              ) : (
                <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold leading-relaxed text-emerald-900">
                  {order.shop_order_id ? `Order ${order.shop_order_id}` : "This order"} is in the
                  main Orders page. Continue status updates there.
                </div>
              )}
              {order.status === "New" && (
                <button
                  onClick={() => void onAdvance(order, "Cancelled")}
                  disabled={busyId === order.id}
                  className="mt-2 min-h-9 w-full rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-rose-700"
                >
                  Cancel request
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CustomerIdentity({ name, phone }: { name: string; phone: string }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-blue-50/60 p-2.5 text-xs">
      <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
        <UserRound className="h-3.5 w-3.5 text-blue-700" />
        {name}
      </span>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-1.5 font-semibold text-blue-800"
        >
          <Phone className="h-3.5 w-3.5" />
          {phone}
        </a>
      )}
    </div>
  );
}

function SmallStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "green";
}) {
  const color =
    tone === "blue" ? "text-blue-800" : tone === "amber" ? "text-amber-800" : "text-emerald-800";
  return (
    <div className="min-w-0 rounded-xl bg-white p-3">
      <p className="truncate text-[10px] font-semibold text-baky-muted sm:text-xs">{label}</p>
      <p className={`mt-1 text-xl font-extrabold sm:text-2xl ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="mt-3 rounded-xl border border-dashed border-black/10 bg-white p-8 text-center text-sm text-baky-muted">
      {text}
    </p>
  );
}
