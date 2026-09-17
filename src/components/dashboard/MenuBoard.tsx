import { useStore } from "@/lib/store";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      className={`relative h-[21px] w-[43px] shrink-0 rounded-full transition-colors ${
        on ? "bg-baky-green" : "bg-baky-track"
      }`}
    >
      <span
        className={`absolute top-1/2 h-[17px] w-[17px] -translate-y-1/2 rounded-full bg-white transition-all ${
          on ? "left-[24px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

export function MenuBoard() {
  const {
    categories,
    items,
    addCategory,
    toggleCategory,
    addItem,
    toggleItem,
  } = useStore();

  const handleAddCategory = () => {
    const name = window.prompt("New category name")?.trim();
    if (name) addCategory(name);
  };

  const handleAddItem = () => {
    const name = window.prompt("Item name")?.trim();
    if (!name) return;
    const priceRaw = window.prompt("Price (₹)", "100")?.trim();
    const price = Number(priceRaw);
    if (!priceRaw || Number.isNaN(price)) return;
    const variantsRaw = window.prompt(
      "Variants (comma separated, leave blank for none)",
      "",
    );
    const variants = (variantsRaw ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const categoryId = categories[0]?.id ?? "c1";
    addItem({ name, price, categoryId, variants });
  };

  return (
    <div className="flex flex-1 flex-col rounded-[15px] bg-baky-surface">
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        {/* Category column */}
        <section className="flex flex-col border-b border-baky-muted/50 p-3 md:border-b-0 md:border-r md:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">
              Category ({categories.length})
            </h2>
            <button
              onClick={handleAddCategory}
              className="text-xs font-semibold text-[#1177E5] md:text-sm lg:text-lg"
            >
              + ADD NEW
            </button>
          </div>

          <ul className="mt-3 divide-y divide-baky-muted/30 md:mt-4 lg:mt-6">
            {categories.map((c, i) => (
              <li
                key={c.id}
                className={`flex items-center justify-between px-2 py-3 text-sm text-black md:py-3.5 md:text-base lg:py-4 lg:text-xl ${
                  i === 0 ? "bg-baky-card" : ""
                }`}
              >
                <span className="min-w-0 truncate">{c.name}</span>
                <Toggle on={c.enabled} onToggle={() => toggleCategory(c.id)} />
              </li>
            ))}
          </ul>
        </section>

        {/* Items column */}
        <section className="flex flex-col p-3 md:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">
              Items ({items.length})
            </h2>
            <button
              onClick={handleAddItem}
              className="text-xs font-semibold text-[#1177E5] md:text-sm lg:text-lg"
            >
              + ADD NEW
            </button>
          </div>

          <ul className="mt-3 space-y-3.5 md:mt-4 md:space-y-4 lg:mt-6 lg:space-y-6">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 lg:gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-baky-bar-strong md:h-[8px] md:w-[8px] lg:h-[9px] lg:w-[9px]" />
                    <p className="text-sm text-black md:text-base lg:text-xl">
                      {item.name}, ₹{item.price}
                    </p>
                  </div>
                  {item.variants.length > 0 && (
                    <p className="mt-0.5 pl-4 text-xs font-semibold text-[#1177E5] md:text-sm lg:mt-1 lg:text-[15px]">
                      + {item.variants.length} Variants
                    </p>
                  )}
                </div>
                <Toggle on={item.enabled} onToggle={() => toggleItem(item.id)} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
