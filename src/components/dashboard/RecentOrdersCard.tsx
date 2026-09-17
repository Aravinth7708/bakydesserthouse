import { useStore } from "@/lib/store";

export function RecentOrdersCard() {
  const { orders } = useStore();
  const recent = orders.slice(0, 4);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Served":
        return "bg-[#65B54E]/20 text-[#2d6e19]";
      case "Preparing":
        return "bg-amber-100 text-amber-800";
      case "New":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="rounded-[10px] bg-baky-card p-4 md:p-6 lg:rounded-[15px] lg:p-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-baky-muted md:text-base lg:text-xl">
          Recent Orders
        </p>
        <span className="text-[10px] text-baky-muted md:text-sm">
          {orders.length} total
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 border-b border-baky-muted/60 pb-3 text-[10px] font-normal text-baky-muted md:text-sm lg:mt-6 lg:text-[17px]">
        <span>Order #</span>
        <span>Product</span>
        <span>Amount</span>
        <span className="text-right">Status</span>
      </div>

      {recent.length === 0 ? (
        <div className="flex h-20 items-center justify-center text-xs text-baky-muted md:text-sm">
          No orders yet. Place an order in POS to see it here!
        </div>
      ) : (
        <ul className="divide-y divide-baky-muted/20">
          {recent.map((o) => {
            const productSummary = o.lines
              .map((l) => `${l.qty}x ${l.name}`)
              .join(", ");
            return (
              <li
                key={o.id}
                className="grid grid-cols-4 items-center py-2.5 text-xs text-black md:py-3 md:text-sm lg:text-base"
              >
                <span className="font-semibold text-black">{o.id}</span>
                <span
                  className="truncate pr-2 text-black/80"
                  title={productSummary}
                >
                  {productSummary}
                </span>
                <span className="font-medium text-black">₹{o.total}</span>
                <div className="text-right">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium md:text-xs ${getStatusStyle(
                      o.status,
                    )}`}
                  >
                    {o.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
