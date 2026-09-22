import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useStore, type OrderLine } from "@/lib/store";

export function PosBoard() {
  const { categories, items, placeOrder } = useStore();
  const enabledCategories = categories.filter((c) => c.enabled);
  const [activeCat, setActiveCat] = useState<string>(enabledCategories[0]?.id ?? "");
  const [cart, setCart] = useState<Record<string, OrderLine>>({});

  // Auto-sync activeCat if categories update, load from Supabase, or get disabled
  useEffect(() => {
    if (enabledCategories.length > 0 && !enabledCategories.some((c) => c.id === activeCat)) {
      setActiveCat(enabledCategories[0].id);
    } else if (enabledCategories.length === 0) {
      setActiveCat("");
    }
  }, [categories, activeCat]);

  const visibleItems = items.filter(
    (i) =>
      i.enabled &&
      enabledCategories.some((c) => c.id === i.categoryId) &&
      (activeCat ? i.categoryId === activeCat : true),
  );

  const addToCart = (name: string, price: number) => {
    setCart((prev) => {
      const existing = prev[name];
      return {
        ...prev,
        [name]: {
          name,
          price,
          qty: existing ? existing.qty + 1 : 1,
        },
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

  const lines = Object.values(cart);
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const handleCheckout = () => {
    if (lines.length === 0) {
      toast.error("Add items to the order first.");
      return;
    }
    placeOrder(lines);
    setCart({});
    toast.success("Order placed! View it under Orders.");
  };

  return (
    <div className="flex flex-1 flex-col rounded-[15px] bg-baky-surface w-full max-w-full overflow-visible sm:overflow-hidden">
      {/* Mobile: Sticky Horizontal Category Pills */}
      <div className="sticky top-0 z-20 flex flex-col border-b border-baky-muted/30 p-3 bg-baky-surface sm:hidden">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-baky-muted uppercase tracking-wider">
            Categories ({enabledCategories.length})
          </span>
          {lines.length > 0 && (
            <span className="rounded-full bg-[#3395FF]/10 px-2 py-0.5 text-xs font-medium text-[#1177E5]">
              {lines.reduce((s, l) => s + l.qty, 0)} in Cart · ₹{total}
            </span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {enabledCategories.map((c) => {
            const isSelected = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-[#3395FF] text-white shadow-sm"
                    : "bg-baky-card text-black hover:bg-baky-card/80"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Desktop / Tablet: Category Column */}
        <section className="hidden sm:flex flex-col border-r border-baky-muted/50 p-4 md:p-5 lg:p-6">
          <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">
            Category ({enabledCategories.length})
          </h2>

          <ul className="mt-4 divide-y divide-baky-muted/30 md:mt-6">
            {enabledCategories.length === 0 ? (
              <li className="px-2 py-3 text-sm text-baky-muted">
                No active categories. Enable some under Menu.
              </li>
            ) : (
              enabledCategories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveCat(c.id)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-3 text-left text-base text-black transition-colors md:py-3.5 md:text-lg lg:py-4 lg:text-xl ${
                      activeCat === c.id
                        ? "bg-baky-card font-medium"
                        : "hover:bg-baky-card/50"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-base font-semibold text-[#1177E5] md:text-lg">
                      {activeCat === c.id ? "•" : ">"}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Items Column (both Mobile and Desktop) */}
        <section className="flex flex-1 flex-col p-3 sm:p-4 md:p-5 lg:p-6 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-black sm:text-base md:text-xl lg:text-2xl">
              Items ({visibleItems.length})
            </h2>
            {activeCat && (
              <span className="text-xs text-baky-muted sm:hidden">
                {enabledCategories.find((c) => c.id === activeCat)?.name}
              </span>
            )}
          </div>

          <ul className="mt-3 flex-1 space-y-2.5 sm:space-y-3 md:mt-6 md:space-y-4">
            {visibleItems.length === 0 ? (
              <li className="py-8 text-center text-sm text-baky-muted md:text-xl">
                No items in this category.
              </li>
            ) : (
              visibleItems.map((item) => {
                const inCart = cart[item.name]?.qty ?? 0;
                return (
                  <li
                    key={item.id}
                    className={`rounded-lg border border-transparent p-2.5 transition-colors sm:p-3 md:p-3.5 lg:p-4 ${
                      inCart > 0
                        ? "bg-baky-card border-baky-muted/30"
                        : "bg-white/80 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-baky-bar-strong md:h-[9px] md:w-[9px]" />
                          <p className="text-sm font-medium text-black sm:text-base md:text-lg lg:text-xl">
                            {item.name},{" "}
                            <span className="font-semibold text-black">
                              ₹{item.price}
                            </span>
                          </p>
                        </div>
                        {item.variants.length > 0 && (
                          <ul className="mt-1 space-y-1 pl-4 sm:mt-1.5 md:mt-2 md:space-y-2">
                            {item.variants.map((v) => (
                              <li
                                key={v}
                                className="flex items-center gap-1.5 text-[11px] text-baky-muted sm:text-xs md:text-sm lg:text-[15px]"
                              >
                                <span className="h-[5px] w-[5px] shrink-0 rounded-full border border-baky-muted md:h-[7px] md:w-[7px]" />
                                {v}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Quantity Controls / Add Button */}
                      <div className="shrink-0 pt-0.5">
                        {inCart > 0 ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                            <button
                              onClick={() => removeFromCart(item.name)}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-baky-track text-sm font-semibold text-black hover:bg-gray-300 md:h-8 md:w-8 md:text-lg"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-semibold text-black sm:text-sm md:text-base">
                              {inCart}
                            </span>
                            <button
                              onClick={() => addToCart(item.name, item.price)}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3395FF] text-sm font-semibold text-white hover:bg-[#2a86ea] md:h-8 md:w-8 md:text-lg"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item.name, item.price)}
                            className="rounded-md bg-[#3395FF]/10 px-3 py-1.5 text-xs font-semibold text-[#1177E5] transition-colors hover:bg-[#3395FF] hover:text-white sm:text-sm md:text-base"
                          >
                            + ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Cart Breakdown & Checkout (Sticky at Bottom on Mobile) */}
          <div className="sticky bottom-0 z-20 bg-baky-surface pt-3 pb-1 border-t border-baky-muted/30 sm:static sm:bg-transparent sm:p-0 sm:border-0">
            {lines.length > 0 && (
              <div className="space-y-1.5 border-t border-baky-muted/40 pt-2 pb-2 md:mt-6 md:pt-4">
                <div className="flex items-center justify-between text-xs font-medium text-baky-muted">
                  <span>Cart Items</span>
                  <span>{lines.reduce((s, l) => s + l.qty, 0)} qty</span>
                </div>
                <div className="max-h-24 sm:max-h-32 overflow-y-auto divide-y divide-baky-muted/20">
                  {lines.map((l) => (
                    <div
                      key={l.name}
                      className="flex justify-between py-1 text-xs text-black sm:text-sm md:text-base"
                    >
                      <span className="truncate pr-2">
                        {l.name} × {l.qty}
                      </span>
                      <span className="shrink-0 font-medium">₹{l.price * l.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <div className="pt-2 md:mt-6">
              <button
                onClick={handleCheckout}
                disabled={lines.length === 0}
                className={`flex h-[48px] w-full items-center justify-center rounded-[12px] text-base font-medium text-white transition-all sm:h-[54px] md:h-[62px] md:text-xl lg:h-[70px] lg:text-2xl ${
                  lines.length > 0
                    ? "bg-[#3395FF] shadow hover:bg-[#2a86ea] active:scale-[0.99]"
                    : "bg-gray-300 cursor-not-allowed opacity-60"
                }`}
              >
                {total > 0 ? `Place Order · ₹${total}` : "Select items to order"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
