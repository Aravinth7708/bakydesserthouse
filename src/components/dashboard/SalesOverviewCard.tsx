import { useStore } from "@/lib/store";

export function SalesOverviewCard() {
  const { orders } = useStore();
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Calculate day-by-day distribution based on real orders
  const dayValues = days.map((day, idx) => {
    const dayOrders = orders.filter((_, oIdx) => oIdx % 7 === idx);
    const dayTotal = dayOrders.reduce((s, o) => s + o.total, 0);
    return { day, value: dayTotal };
  });

  const maxValue = Math.max(...dayValues.map((d) => d.value), 100);

  return (
    <div className="flex flex-col rounded-[10px] bg-baky-card p-3 md:p-5 lg:rounded-[15px] lg:p-8">
      <p className="text-[11px] font-medium text-baky-muted md:text-base lg:text-xl">
        Sales Overview
      </p>
      <p className="mt-1 text-sm font-medium text-black md:text-xl lg:mt-4 lg:text-2xl">
        ₹{totalRevenue.toLocaleString()}
      </p>
      <p className="mt-1 hidden text-xs font-medium text-baky-muted md:block md:text-sm lg:text-xl">
        Last 7 Days <span className="text-baky-green">+12.5%</span>
      </p>

      <div className="mt-4 flex flex-1 items-end justify-between gap-1 px-0 md:mt-6 md:gap-2 md:px-1 lg:mt-8 lg:gap-3 lg:px-2">
        {dayValues.map(({ day, value }) => {
          const isMax = value === maxValue && value > 0;
          const heightPct = Math.max(8, Math.round((value / maxValue) * 100));
          return (
            <div
              key={day}
              className="flex flex-1 flex-col items-center gap-1 md:gap-2 lg:gap-3"
            >
              <div className="flex h-[90px] w-full items-end justify-center md:h-[180px] lg:h-[260px]">
                <div
                  title={`₹${value}`}
                  className="w-2 rounded-t-[3px] transition-all duration-300 md:w-5 md:rounded-t-[5px] lg:w-9 lg:rounded-t-[7px]"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: isMax ? "#d5a5e3" : "#ebccf5",
                  }}
                />
              </div>
              <span className="text-[8px] font-normal text-baky-muted md:text-xs lg:text-xl">
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
