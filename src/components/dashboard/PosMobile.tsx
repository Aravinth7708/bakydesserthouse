import { useRef, useState } from "react";
import { Bell, User, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore, type OrderLine } from "@/lib/store";

type DrawerStage = "closed" | "menu" | "summary";

export function PosMobile() {
  const { categories, items, orders, placeOrder } = useStore();
  const [stage, setStage] = useState<DrawerStage>("closed");
  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id ?? "");
  const [cart, setCart] = useState<Record<string, OrderLine>>({});

  const dragStartY = useRef<number | null>(null);

  const visibleItems = items.filter(
    (i) => i.enabled && (activeCat ? i.categoryId === activeCat : true),
  );

  const lines = Object.values(cart);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const cgst = +(subtotal * 0.025).toFixed(2);
  const sgst = +(subtotal * 0.025).toFixed(2);
  const totalIncTax = +(subtotal + cgst + sgst).toFixed(2);

  const totalItemsSold = orders.reduce(
    (s, o) => s + o.lines.reduce((n, l) => n + l.qty, 0),
    0,
  );

  const addToCart = (name: string, price: number) => {
    setCart((prev) => {
      const existing = prev[name];
      return {
        ...prev,
        [name]: { name, price, qty: existing ? existing.qty + 1 : 1 },
      };
    });
  };

  const removeFromCart = (name: string) => {
    setCart((prev) => {
      const existing = prev[name];
      if (!existing) return prev;
      const next = { ...prev };
      if (existing.qty <= 1) delete next[name];
      else next[name] = { ...existing, qty: existing.qty - 1 };
      return next;
    });
  };

  const handleCheckout = () => {
    if (lines.length === 0) {
      toast.error("Add items to the order first.");
      return;
    }
    placeOrder(lines);
    setCart({});
    setStage("closed");
    toast.success("Order placed! View it under Orders.");
  };

  // --- Swipe handling on the drawer handle ---
  const onTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - dragStartY.current;
    dragStartY.current = null;
    if (delta < -40) setStage(stage === "closed" ? "menu" : stage);
    else if (delta > 40) setStage("closed");
  };

  const recent = orders.slice(0, 6);

  return (
    <div className="relative flex h-[100dvh] w-full flex-1 flex-col overflow-hidden bg-white sm:hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5">
        {/* left spacer for the fixed hamburger from Sidebar */}
        <span className="h-8 w-8" />
        <div className="flex items-center gap-5 text-black">
          <Bell className="h-6 w-6" strokeWidth={1.5} />
          <User className="h-6 w-6" strokeWidth={1.5} />
        </div>
      </header>

      {/* Recent orders / base content */}
      <div className="flex-1 overflow-y-auto px-5 pb-[140px] pt-5">
        <h1 className="text-[22px] font-medium leading-6 text-black">
          Point of Sale
        </h1>
        <p className="mt-3 text-xs font-medium text-baky-muted">Total Item Sold</p>
        <p className="mt-1 text-sm font-medium text-black">
          {totalItemsSold} Items
        </p>

        <div className="my-4 border-t border-[#AEAEAE]" />

        <p className="text-xs font-medium text-baky-muted">Recent Orders</p>

        <ul className="mt-3 space-y-[10px]">
          {recent.length === 0 ? (
            <li className="rounded-sm bg-baky-surface px-3 py-4 text-sm text-baky-muted">
              No orders yet.
            </li>
          ) : (
            recent.map((o) => (
              <li
                key={o.id}
                className="flex items-center gap-3 rounded-sm bg-baky-surface px-[10px] py-[6px]"
              >
                <span className="rounded-[3px] bg-[#65B54E]/50 px-[6px] py-[2px] text-xs font-medium text-black">
                  Cash
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-black">{o.id}</p>
                  <p className="truncate text-sm font-medium text-black">
                    {o.lines.map((l) => `${l.qty}x ${l.name}`).join(", ")}
                  </p>
                </div>
                <span className="text-sm font-medium text-black">
                  ₹{o.total}
                </span>
                <Pencil className="h-5 w-5 shrink-0 text-[#FF8205]" />
                <Trash2 className="h-5 w-5 shrink-0 text-[#FF0000]" />
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Collapsed drawer handle */}
      {stage === "closed" && (
        <div
          onClick={() => setStage("menu")}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="absolute inset-x-0 bottom-0 z-20 cursor-pointer rounded-t-[24px] bg-baky-surface px-5 pb-6 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-baky-muted" />
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-medium leading-5 text-black">
                Quick POS Drawer
              </p>
              <p className="mt-0.5 text-xs font-medium text-baky-muted">
                Swipe up to record sale
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium leading-5 text-black">Total</p>
              <p className="text-base font-medium leading-5 text-black">
                ₹{subtotal}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expanded drawer */}
      {stage !== "closed" && (
        <div className="absolute inset-x-0 bottom-0 top-[120px] z-20 flex flex-col rounded-t-[24px] bg-baky-surface shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
          {/* Handle + header */}
          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={() => setStage("closed")}
            className="shrink-0 cursor-pointer px-5 pt-3"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-baky-muted" />
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-medium leading-5 text-black">
                  Quick POS Drawer
                </p>
                <p className="mt-0.5 text-xs font-medium text-baky-muted">
                  Swipe down to close
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium leading-5 text-black">
                  Total
                </p>
                <p className="text-base font-medium leading-5 text-black">
                  ₹{subtotal}
                </p>
              </div>
            </div>
          </div>

          {stage === "menu" ? (
            <>
              {/* Category pills */}
              <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories
                  .filter((c) => c.enabled)
                  .map((c) => {
                    const on = activeCat === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveCat(c.id)}
                        className={`h-7 shrink-0 rounded-[18px] border px-3 text-xs font-medium transition-colors ${
                          on
                            ? "border-black bg-black text-white"
                            : "border-black bg-[#E1E1E1] text-black"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
              </div>

              {/* Item list */}
              <ul className="mt-1 flex-1 divide-y divide-[#AEAEAE]/40 overflow-y-auto">
                {visibleItems.length === 0 ? (
                  <li className="px-4 py-5 text-sm text-baky-muted">
                    No items in this category.
                  </li>
                ) : (
                  visibleItems.map((item) => {
                    const inCart = cart[item.name]?.qty ?? 0;
                    return (
                      <li
                        key={item.id}
                        className={`px-4 py-3 ${inCart > 0 ? "bg-baky-card" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2">
                            <span className="mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full bg-baky-bar-strong" />
                            <div className="min-w-0">
                              <p className="text-sm leading-5 text-black">
                                {item.name}, ₹{item.price}
                              </p>
                              {item.variants.length > 0 && (
                                <p className="mt-0.5 text-xs font-semibold text-[#1177E5]">
                                  + {item.variants.length} Variants
                                </p>
                              )}
                            </div>
                          </div>
                          {inCart > 0 ? (
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                onClick={() => removeFromCart(item.name)}
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-baky-track text-sm font-semibold text-black"
                              >
                                −
                              </button>
                              <span className="w-4 text-center text-sm font-semibold">
                                {inCart}
                              </span>
                              <button
                                onClick={() => addToCart(item.name, item.price)}
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3395FF] text-sm font-semibold text-white"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item.name, item.price)}
                              className="shrink-0 text-xs font-semibold text-[#1177E5]"
                            >
                              + ADD
                            </button>
                          )}
                        </div>
                        {item.variants.length > 0 && (
                          <ul className="mt-1.5 space-y-1 pl-4">
                            {item.variants.map((v) => (
                              <li
                                key={v}
                                className="flex items-center gap-2 text-xs text-baky-muted"
                              >
                                <span className="h-[7px] w-[7px] shrink-0 rounded-full border-[1.5px] border-baky-muted" />
                                {v}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>

              {/* Footer buttons */}
              <div className="shrink-0 space-y-2 px-4 pb-5 pt-2">
                <button
                  onClick={handleCheckout}
                  className="flex h-10 w-full items-center justify-center rounded-[12px] bg-[#3395FF] text-sm font-medium text-white"
                >
                  Takeaway
                </button>
                <button
                  onClick={() => {
                    if (lines.length === 0) {
                      toast.error("Add items to the order first.");
                      return;
                    }
                    setStage("summary");
                  }}
                  className="flex h-10 w-full items-center justify-center rounded-[12px] bg-[#0AC655] text-sm font-medium text-white"
                >
                  Process Order
                </button>
              </div>
            </>
          ) : (
            /* Order summary */
            <div className="flex flex-1 flex-col overflow-hidden px-4 pt-3">
              <div className="flex flex-1 flex-col overflow-hidden rounded-[10px] border border-baky-muted bg-baky-card p-4">
                <h2 className="text-center text-base font-medium leading-5 text-black">
                  Order Summary
                </h2>
                <ul className="mt-3 flex-1 divide-y divide-[#AEAEAE] overflow-y-auto">
                  {lines.map((l) => (
                    <li
                      key={l.name}
                      className="flex items-start justify-between gap-3 py-2"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full bg-baky-bar-strong" />
                        <p className="text-sm leading-5 text-black">
                          {l.name}, ₹{l.price}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-black">
                        x{l.qty}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 border-t border-baky-muted pt-3">
                  <div className="flex justify-between text-sm font-medium text-black">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-black">
                    <span>CGST (2.5%)</span>
                    <span>₹{cgst}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-black">
                    <span>SGST (2.5%)</span>
                    <span>₹{sgst}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm font-medium text-black">
                    <span>Total (inc Tax)</span>
                    <span>₹{totalIncTax}</span>
                  </div>
                </div>
              </div>

              {/* Payment buttons */}
              <div className="shrink-0 space-y-2 py-3">
                <div className="grid grid-cols-3 gap-2">
                  {["Cash", "Gpay", "Online"].map((p) => (
                    <button
                      key={p}
                      onClick={handleCheckout}
                      className="flex h-10 items-center justify-center rounded-[12px] bg-[#3395FF] text-sm font-medium text-white"
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCheckout}
                  className="flex h-10 w-full items-center justify-center rounded-[12px] bg-[#0AC655] text-sm font-medium text-white"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
