import { useStore } from "@/lib/store";

function StatCard({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[77px] flex-col justify-center rounded-[10px] bg-baky-card p-3 md:min-h-[105px] md:p-4 lg:min-h-[123px] lg:rounded-[15px] lg:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCards() {
  const { orders, inventory, expenses, dateRange } = useStore();

  const cutoffMs = (() => {
    const now = new Date();
    if (dateRange === "Today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return start.getTime();
    }
    if (dateRange === "Last 7 Days") return now.getTime() - 7 * 86400000;
    if (dateRange === "Last 30 Days") return now.getTime() - 30 * 86400000;
    return 0;
  })();

  const filteredOrders = orders.filter((o) => {
    if (!o.createdAt || cutoffMs === 0) return true;
    const t = new Date(o.createdAt).getTime();
    return Number.isNaN(t) ? true : t >= cutoffMs;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (!e.date || cutoffMs === 0) return true;
    const t = new Date(e.date).getTime();
    return Number.isNaN(t) ? true : t >= cutoffMs;
  });

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lowStockItems = inventory.filter(
    (item) => item.current <= Math.max(2, Math.round(item.max * 0.3)),
  );

  return (
    <div className="grid grid-cols-4 gap-2.5 md:gap-4 lg:gap-6">
      <StatCard>
        <p className="text-[10px] font-medium text-baky-muted md:text-sm lg:text-xl">
          {dateRange === "Today" ? "Today Orders" : "Total Orders"}
        </p>
        <p className="mt-1 text-lg font-medium leading-none text-black md:mt-1.5 md:text-2xl lg:mt-2 lg:text-[26px]">
          {totalOrders}
        </p>
        <p className="mt-1 text-[10px] font-medium text-baky-green md:mt-1.5 md:text-sm lg:mt-2 lg:text-xl">
          {totalOrders > 0 ? `+${Math.min(100, totalOrders * 4)}%` : "0%"}
        </p>
      </StatCard>

      <StatCard>
        <p className="text-[10px] font-medium text-baky-muted md:text-sm lg:text-xl">
          {dateRange === "Today" ? "Today Revenue" : "Total Revenue"}
        </p>
        <p className="mt-1 text-lg font-medium leading-none text-black md:mt-1.5 md:text-2xl lg:mt-2 lg:text-[26px]">
          ₹{totalRevenue.toLocaleString()}
        </p>
        <p className="mt-1 text-[10px] font-medium text-baky-green md:mt-1.5 md:text-sm lg:mt-2 lg:text-xl">
          {totalRevenue > 0 ? "+8.16%" : "0%"}
        </p>
      </StatCard>

      <StatCard>
        <p className="text-[10px] font-medium text-baky-muted md:text-sm lg:text-xl">
          Total Expenses
        </p>
        <p className="mt-1 text-lg font-medium leading-none text-black md:mt-1.5 md:text-2xl lg:mt-2 lg:text-[26px]">
          ₹{totalExpenses.toLocaleString()}
        </p>
        <p className="mt-1 text-[10px] font-medium text-baky-muted md:mt-1.5 md:text-sm lg:mt-2 lg:text-xl">
          {filteredExpenses.length} records
        </p>
      </StatCard>

      <StatCard>
        <p className="text-[10px] font-medium text-baky-muted md:text-sm lg:text-xl">
          Low Stock Items
        </p>
        <p className="mt-1 text-lg font-medium leading-none text-black md:mt-1.5 md:text-2xl lg:mt-2 lg:text-[26px]">
          {lowStockItems.length}
        </p>
        <p
          className={`mt-1 text-[10px] font-medium md:mt-1.5 md:text-sm lg:mt-2 lg:text-xl ${
            lowStockItems.length > 0 ? "text-baky-red" : "text-baky-green"
          }`}
        >
          {lowStockItems.length > 0 ? "Action required" : "All stocked"}
        </p>
      </StatCard>
    </div>
  );
}
