import { Pencil } from "lucide-react";
import { useStore } from "@/lib/store";

export function InventoryBoard() {
  const { inventory, addInventoryItem, updateStock } = useStore();

  const handleAdd = () => {
    const name = window.prompt("Item name")?.trim();
    if (!name) return;
    const max = Number(window.prompt("Max stock", "10")?.trim());
    const current = Number(window.prompt("Current stock", "0")?.trim());
    if (Number.isNaN(max) || Number.isNaN(current)) return;
    addInventoryItem({ name, current, max });
  };

  const handleEdit = (id: string, cur: number, mx: number) => {
    const current = Number(window.prompt("Current stock", String(cur))?.trim());
    if (Number.isNaN(current)) return;
    const max = Number(window.prompt("Max stock", String(mx))?.trim());
    if (Number.isNaN(max)) return;
    updateStock(id, current, max);
  };

  return (
    <div className="flex flex-1 flex-col rounded-[15px] bg-baky-surface p-3 md:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">
          Item ({inventory.length})
        </h2>
        <button
          onClick={handleAdd}
          className="text-xs font-semibold text-[#1177E5] md:text-sm lg:text-lg"
        >
          + ADD NEW
        </button>
      </div>

      <ul className="mt-3 divide-y divide-baky-muted/30 md:mt-4 lg:mt-6">
        {inventory.map((item) => {
          const low = item.current <= item.max * 0.3;
          return (
            <li
              key={item.id}
              className={`flex items-center justify-between gap-3 px-2 py-3 md:gap-4 md:py-3.5 lg:py-4 ${
                low ? "bg-baky-card" : ""
              }`}
            >
              <span
                className={`min-w-0 truncate text-sm md:text-base lg:text-xl ${
                  low ? "text-black" : "text-baky-muted"
                }`}
              >
                {item.name}
              </span>
              <div className="flex shrink-0 items-center gap-2 md:gap-3 lg:gap-3">
                <span
                  className={`text-xs font-semibold md:text-sm lg:text-lg ${
                    low ? "text-[#1177E5]" : "text-baky-muted"
                  }`}
                >
                  {item.current} / {item.max}
                </span>
                <button
                  aria-label="Edit item"
                  onClick={() => handleEdit(item.id, item.current, item.max)}
                >
                  <Pencil
                    className="h-4 w-4 md:h-5 md:w-5"
                    style={{ color: low ? "#FF8205" : "#686868" }}
                    strokeWidth={2}
                  />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
