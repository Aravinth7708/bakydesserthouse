import { useStore } from "@/lib/store";

export function TopSellingCard() {
  const { orders } = useStore();

  const itemCounts: Record<string, number> = {};
  let totalSold = 0;

  orders.forEach((o) => {
    o.lines.forEach((l) => {
      itemCounts[l.name] = (itemCounts[l.name] || 0) + l.qty;
      totalSold += l.qty;
    });
  });

  const sortedTop = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const colors = ["#d5a5e3", "#ebccf5"];

  return (
    <div className="flex flex-col rounded-[10px] bg-baky-card p-3 md:p-5 lg:rounded-[15px] lg:p-8">
      <p className="text-[11px] font-medium text-baky-muted md:text-base lg:text-xl">
        Top Selling
      </p>

      <div className="flex flex-1 items-center justify-center py-4 md:py-6 lg:py-8">
        <div className="flex h-[90px] w-[90px] items-center justify-center rounded-full border-[14px] border-[#555555] md:h-[160px] md:w-[160px] md:border-[24px] lg:h-[212px] lg:w-[212px] lg:border-[32px]">
          <div className="text-center">
            <p className="text-base font-medium leading-none text-black md:text-2xl lg:text-[26px]">
              {totalSold}
            </p>
            <p className="mt-0.5 text-[9px] font-medium text-baky-muted md:text-sm lg:mt-1 lg:text-xl">
              Total Sold
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 px-0 md:space-y-2 md:px-1 lg:space-y-2 lg:px-2">
        {sortedTop.length === 0 ? (
          <p className="text-center text-xs text-baky-muted">No items sold yet.</p>
        ) : (
          sortedTop.map(([name, count], idx) => (
            <div
              key={name}
              className="flex items-center justify-between text-[9px] md:text-sm lg:text-xl"
            >
              <div className="flex min-w-0 items-center gap-1.5 md:gap-2.5 lg:gap-3">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full md:h-2.5 md:w-2.5 lg:h-3 lg:w-3"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="truncate font-normal text-baky-muted">{name}</span>
              </div>
              <span className="font-medium text-black">{count} sold</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
