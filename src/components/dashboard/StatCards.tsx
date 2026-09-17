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
  return (
    <div className="grid grid-cols-4 gap-2.5 md:gap-4 lg:gap-6">
      <StatCard>
        <p className="text-[10px] font-medium text-baky-muted md:text-sm lg:text-xl">Today Orders</p>
        <p className="mt-1 text-lg font-medium leading-none text-black md:mt-1.5 md:text-2xl lg:mt-2 lg:text-[26px]">75</p>
        <p className="mt-1 text-[10px] font-medium text-baky-green md:mt-1.5 md:text-sm lg:mt-2 lg:text-xl">+4.25%</p>
      </StatCard>

      <StatCard>
        <p className="text-[10px] font-medium text-baky-muted md:text-sm lg:text-xl">Today Revenue</p>
        <p className="mt-1 text-lg font-medium leading-none text-black md:mt-1.5 md:text-2xl lg:mt-2 lg:text-[26px]">
          1,030
        </p>
        <p className="mt-1 text-[10px] font-medium text-baky-green md:mt-1.5 md:text-sm lg:mt-2 lg:text-xl">+8.16%</p>
      </StatCard>

      <StatCard>{null}</StatCard>{/* intentionally empty per design */}

      <StatCard>
        <p className="text-[10px] font-medium text-baky-muted md:text-sm lg:text-xl">Low Stock Items</p>
        <p className="mt-1 text-lg font-medium leading-none text-black md:mt-1.5 md:text-2xl lg:mt-2 lg:text-[26px]">2</p>
        <p className="mt-1 text-[10px] font-medium text-baky-red md:mt-1.5 md:text-sm lg:mt-2 lg:text-xl">Action required</p>
      </StatCard>
    </div>
  );
}
