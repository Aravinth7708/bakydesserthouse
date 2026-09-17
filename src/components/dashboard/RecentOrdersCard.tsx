export function RecentOrdersCard() {
  return (
    <div className="rounded-[10px] bg-baky-card p-4 md:p-6 lg:rounded-[15px] lg:p-8">
      <p className="text-xs font-medium text-baky-muted md:text-base lg:text-xl">Recent Orders</p>

      <div className="mt-4 grid grid-cols-4 border-b border-baky-muted/60 pb-3 text-[10px] font-normal text-baky-muted md:text-sm lg:mt-6 lg:text-[17px]">
        <span>Order #</span>
        <span>Product</span>
        <span>Amount</span>
        <span>Status</span>
      </div>

      {/* Empty body per design */}
      <div className="h-16 md:h-20 lg:h-24" />
    </div>
  );
}
