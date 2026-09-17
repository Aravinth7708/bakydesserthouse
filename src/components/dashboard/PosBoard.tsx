import { useState } from "react";
import { toast } from "sonner";
import { useStore, type OrderLine } from "@/lib/store";

export function PosBoard() {
  const { categories, items, placeOrder } = useStore();
  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id ?? "");
  const [cart, setCart] = useState<Record<string, OrderLine>>({});

  const visibleItems = items.filter(
    (i) => i.enabled && (activeCat ? i.categoryId === activeCat : true),
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
    <div className="flex flex-1 flex-col rounded-[15px] bg-baky-surface">
      <div className="grid flex-1 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Category column */}
        <section className="flex flex-col border-b border-baky-muted/50 p-3 sm:border-b-0 sm:border-r md:p-5 lg:p-6">
          <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">
            Category ({categories.length})
          </h2>

          <ul className="mt-4 divide-y divide-baky-muted/30 md:mt-6">
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveCat(c.id)}
                  className={`flex w-full items-center justify-between px-2 py-3 text-left text-base text-black md:py-3.5 md:text-lg lg:py-4 lg:text-xl ${
                    activeCat === c.id ? "bg-baky-card" : ""
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-base font-semibold text-[#1177E5] md:text-lg">
                    {activeCat === c.id ? "•" : ">"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Items column */}
        <section className="flex flex-col p-3 md:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">
              Items ({visibleItems.length})
            </h2>
          </div>

          <ul className="mt-4 flex-1 space-y-3 md:mt-6 md:space-y-4">
            {visibleItems.length === 0 ? (
              <li className="text-base text-baky-muted md:text-xl">No items in this category.</li>
            ) : (
              visibleItems.map((item) => {
                const inCart = cart[item.name]?.qty ?? 0;
                return (
                  <li
                    key={item.id}
                    className={`rounded-md p-3 md:p-3.5 lg:p-4 ${inCart > 0 ? "bg-baky-card" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-baky-bar-strong md:h-[9px] md:w-[9px]" />
                          <p className="text-base text-black md:text-lg lg:text-xl">
                            {item.name}, ₹{item.price}
                          </p>
                        </div>
                        {item.variants.length > 0 && (
                          <ul className="mt-1.5 space-y-1.5 pl-4 md:mt-2 md:space-y-2">
                            {item.variants.map((v) => (
                              <li
                                key={v}
                                className="flex items-center gap-2 text-xs text-baky-muted md:text-sm lg:text-[15px]"
                              >
                                <span className="h-[7px] w-[7px] shrink-0 rounded-full border-[1.5px] border-baky-muted md:h-[9px] md:w-[9px]" />
                                {v}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {inCart > 0 ? (
                        <div className="flex shrink-0 items-center gap-2 md:gap-3">
                          <button
                            onClick={() => removeFromCart(item.name)}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-baky-track text-base font-semibold text-black md:h-8 md:w-8 md:text-lg"
                          >
                            −
                          </button>
                          <span className="w-4 text-center text-base font-semibold md:text-lg">
                            {inCart}
                          </span>
                          <button
                            onClick={() => addToCart(item.name, item.price)}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3395FF] text-base font-semibold text-white md:h-8 md:w-8 md:text-lg"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item.name, item.price)}
                          className="shrink-0 text-sm font-semibold text-[#1177E5] md:text-base lg:text-lg"
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {lines.length > 0 && (
            <div className="mt-4 space-y-1 border-t border-baky-muted/40 pt-3 md:mt-6 md:pt-4">
              {lines.map((l) => (
                <div
                  key={l.name}
                  className="flex justify-between text-base text-black md:text-lg"
                >
                  <span>
                    {l.name} × {l.qty}
                  </span>
                  <span>₹{l.price * l.qty}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end md:mt-6">
            <button
              onClick={handleCheckout}
              className="flex h-[52px] w-full max-w-[475px] items-center justify-center rounded-[13px] bg-[#3395FF] text-xl font-medium text-white transition-colors hover:bg-[#2a86ea] md:h-[62px] md:text-2xl lg:h-[74px] lg:text-3xl"
            >
              {total > 0 ? `Place Order · ₹${total}` : "Add"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
