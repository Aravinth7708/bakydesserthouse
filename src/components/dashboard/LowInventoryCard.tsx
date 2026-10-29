import { useStore } from "@/lib/store";

export function LowInventoryCard() {
  const { inventory } = useStore();

  return (
    <div className="rounded-[10px] bg-baky-card p-4 md:p-6 lg:rounded-[15px] lg:p-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-baky-muted md:text-base lg:text-xl">
          Low Inventory Alerts
        </p>
        <span className="text-[10px] text-baky-muted md:text-sm">
          {inventory.length} tracked
        </span>
      </div>

      <div className="mt-4 space-y-4 md:space-y-5 lg:mt-6 lg:space-y-6">
        {inventory.length === 0 ? (
          <p className="py-4 text-center text-xs text-baky-muted md:text-sm">
            No inventory items tracked yet.
          </p>
        ) : (
          inventory.map((item) => {
            const isLow = item.current <= Math.max(2, Math.round(item.max * 0.3));
            const pct = Math.min(
              100,
              Math.max(5, Math.round((item.current / (item.max || 1)) * 100)),
            );
            return (
              <div key={item.id || item.name}>
                <div className="flex items-center justify-between text-xs font-normal text-baky-muted md:text-base lg:text-xl">
                  <span className="text-black">{item.name}</span>
                  <span
                    className={
                      isLow ? "font-semibold text-baky-red" : "text-baky-muted"
                    }
                  >
                    {item.current} / {item.max}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-baky-track md:h-2.5 lg:mt-2 lg:h-[13px]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isLow ? "#f87171" : "#d5a5e3",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
