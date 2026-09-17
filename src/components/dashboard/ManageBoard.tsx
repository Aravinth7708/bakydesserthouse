const options = [
  {
    title: "Staff",
    description: "View users and their roles and responsibilities",
  },
  {
    title: "Outlets",
    description: "Update outlet level informations",
  },
];

export function ManageBoard() {
  return (
    <div className="flex flex-1 flex-col rounded-[15px] bg-baky-surface">
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        {/* Admin column */}
        <section className="flex flex-col p-3 md:p-5 lg:p-6 md:border-r md:border-baky-muted/50">
          <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">Admin</h2>

          <ul className="mt-3 border-t border-baky-muted/40 md:mt-4 lg:mt-6">
            {options.map((o) => (
              <li key={o.title}>
                <button className="flex w-full items-center justify-between gap-3 py-3.5 text-left md:gap-4 md:py-5 lg:py-6">
                  <div className="min-w-0">
                    <p className="text-base font-medium text-black md:text-xl lg:text-2xl">{o.title}</p>
                    <p className="mt-0.5 text-sm font-light text-baky-muted md:text-base lg:mt-1 lg:text-xl">
                      {o.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-lg font-medium text-[#3395FF] md:text-xl lg:text-2xl">
                    &gt;
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Empty right column (matches Figma) */}
        <section className="hidden md:block" />
      </div>
    </div>
  );
}
