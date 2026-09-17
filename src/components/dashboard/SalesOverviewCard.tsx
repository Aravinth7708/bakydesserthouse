const bars = [
  { day: "Mon", value: 150, strong: false },
  { day: "Tue", value: 216, strong: false },
  { day: "Wed", value: 172, strong: false },
  { day: "Thu", value: 130, strong: false },
  { day: "Fri", value: 240, strong: true },
  { day: "Sat", value: 231, strong: true },
  { day: "Sun", value: 194, strong: false },
];

const MAX = 240;

export function SalesOverviewCard() {
  return (
    <div className="flex flex-col rounded-[10px] bg-baky-card p-3 md:p-5 lg:rounded-[15px] lg:p-8">
      <p className="text-[11px] font-medium text-baky-muted md:text-base lg:text-xl">Sales Overview</p>
      <p className="mt-1 text-sm font-medium text-black md:text-xl lg:mt-4 lg:text-2xl">₹1,800</p>
      <p className="mt-1 hidden text-xs font-medium text-baky-muted md:block md:text-sm lg:text-xl">
        Last 7 Days <span className="text-baky-green">+12.5%</span>
      </p>

      <div className="mt-4 flex flex-1 items-end justify-between gap-1 px-0 md:mt-6 md:gap-2 md:px-1 lg:mt-8 lg:gap-3 lg:px-2">
        {bars.map(({ day, value, strong }) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-1 md:gap-2 lg:gap-3">
            <div className="flex h-[90px] w-full items-end justify-center md:h-[180px] lg:h-[260px]">
              <div
                className="w-2 rounded-t-[3px] md:w-5 md:rounded-t-[5px] lg:w-9 lg:rounded-t-[7px]"
                style={{
                  height: `${(value / MAX) * 100}%`,
                  backgroundColor: strong ? "#d5a5e3" : "#ebccf5",
                }}
              />
            </div>
            <span className="text-[8px] font-normal text-baky-muted md:text-xs lg:text-xl">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
