const items = [
  { name: "Waffle flour (kg)", current: 5, total: 50 },
  { name: "Brownie pracel plate (Pack)", current: 2, total: 10 },
  { name: "Dark compound (Pack)", current: 1, total: 10 },
];

export function LowInventoryCard() {
  return (
    <div className="rounded-[10px] bg-baky-card p-4 md:p-6 lg:rounded-[15px] lg:p-8">
      <p className="text-xs font-medium text-baky-muted md:text-base lg:text-xl">Low Inventory Alerts</p>

      <div className="mt-4 space-y-4 md:space-y-5 lg:mt-6 lg:space-y-6">
        {items.map(({ name, current, total }) => (
          <div key={name}>
            <div className="flex items-center justify-between text-xs font-normal text-baky-muted md:text-base lg:text-xl">
              <span>{name}</span>
              <span>
                {current} / {total}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-baky-track md:h-2.5 lg:mt-2 lg:h-[13px]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(current / total) * 100}%`,
                  backgroundColor: "#d5a5e3",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
