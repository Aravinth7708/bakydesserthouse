import { Bell, Settings, ChevronDown } from "lucide-react";

export function Topbar({ title = "Dashboard" }: { title?: string }) {
  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-2 bg-baky-surface pl-[60px] pr-3 lg:h-[72px] lg:px-6">
      <h1 className="min-w-0 truncate text-lg font-medium text-black lg:text-xl">
        {title}
      </h1>

      <div className="flex shrink-0 items-center gap-2 lg:gap-3">
        <button className="hidden h-9 items-center gap-2 rounded-[10px] bg-baky-card px-3 text-sm font-medium text-baky-muted sm:flex lg:h-10 lg:rounded-xl lg:px-4 lg:text-base">
          Last 7 Days
          <ChevronDown className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-baky-card text-baky-muted lg:h-10 lg:w-10 lg:rounded-xl">
          <Bell className="h-[18px] w-[18px] lg:h-5 lg:w-5" strokeWidth={1.5} />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-baky-card text-baky-muted lg:h-10 lg:w-10 lg:rounded-xl">
          <Settings className="h-[18px] w-[18px] lg:h-5 lg:w-5" strokeWidth={1.5} />
        </button>
        <div className="h-9 w-9 rounded-full bg-baky-card lg:h-10 lg:w-10" />
      </div>
    </header>
  );
}
