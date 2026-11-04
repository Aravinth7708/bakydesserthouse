import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Award, Copy, Gift, LoaderCircle, Printer, Search, Users, WalletCards } from "lucide-react";
import { getLoyaltyAdminData, type LoyaltyClaim, type LoyaltyCustomer } from "@/lib/loyalty";

type AdminData = Awaited<ReturnType<typeof getLoyaltyAdminData>>;
const money = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

export function LoyaltyAdminBoard() {
  const [data, setData] = useState<AdminData>({
    customers: [],
    ledger: [],
    claims: [],
    orders: [],
  });
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const customerLink =
    typeof window === "undefined" ? "/customer" : `${window.location.origin}/customer`;

  const refresh = useCallback(async () => {
    try {
      const next = await getLoyaltyAdminData();
      setData(next);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load loyalty customers.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredCustomers = useMemo(
    () =>
      data.customers.filter((customer) =>
        `${customer.name} ${customer.phone}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [data.customers, search],
  );
  const selected =
    data.customers.find((customer) => customer.id === selectedId) || filteredCustomers[0];
  const totalPoints = data.customers.reduce((sum, customer) => sum + customer.points_balance, 0);
  const completedClaims = data.claims.filter((claim) => claim.status === "Redeemed").length;
  const pendingClaims = data.claims.filter((claim) => claim.status === "Pending").length;
  const customerOrders = selected
    ? data.orders.filter(
        (order) => order.customer_id === selected.id && order.status === "Completed",
      )
    : [];
  const customerSpend = customerOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const customerClaims = selected
    ? data.claims.filter((claim) => claim.customer_id === selected.id)
    : [];
  const customerLedger = selected
    ? data.ledger.filter((entry) => entry.customer_id === selected.id).slice(0, 12)
    : [];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(customerLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the link. You can select and copy it manually.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-6 sm:gap-5">
      <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-baky-muted">
          Admin portal
        </p>
        <h2 className="mt-1 text-xl font-bold text-black sm:text-2xl">Digital Loyalty Program</h2>
        <p className="mt-1 text-sm text-baky-muted">
          Customer profiles, points, orders, and free brownie claims.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <OverviewCard label="Loyalty customers" value={data.customers.length} icon={Users} />
        <OverviewCard label="Points in circulation" value={totalPoints} icon={Award} />
        <OverviewCard
          label="Brownies redeemed"
          value={completedClaims}
          note={`${pendingClaims} pending`}
          icon={Gift}
        />
      </div>

      <section className="grid min-w-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-black">Customer QR code</h3>
              <p className="mt-1 text-xs text-baky-muted">Print or share this code in your shop.</p>
            </div>
            <button
              onClick={() => window.print()}
              aria-label="Print loyalty QR code"
              className="rounded-lg bg-white p-2 text-gray-700 hover:bg-gray-100 print:hidden"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex justify-center rounded-2xl bg-white p-4">
            <QRCodeSVG
              value={customerLink}
              size={184}
              level="H"
              includeMargin
              aria-label="Customer loyalty QR code"
            />
          </div>
          <div className="mt-3 rounded-xl bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-baky-muted">
              Customer link
            </p>
            <p className="mt-1 break-all text-xs font-medium text-gray-800">{customerLink}</p>
            <button
              onClick={() => void copyLink()}
              className="mt-2 flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#213a20] px-3 text-xs font-bold text-white hover:bg-[#31572e] print:hidden"
            >
              <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-baky-muted">
            1 point per cumulative ₹100 paid. Redeem 10 points for a free brownie.
          </p>
        </aside>

        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-black sm:text-lg">Customer profiles</h3>
                <p className="mt-1 text-xs text-baky-muted">
                  Select a customer to inspect their points and claims.
                </p>
              </div>
              <label className="relative block w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-baky-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or mobile"
                  className="h-10 w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#1177E5]"
                />
              </label>
            </div>
            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800"
              >
                {error}
              </p>
            )}
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-baky-muted">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Loading customers...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-black/10 bg-white p-8 text-center text-sm text-baky-muted">
                No loyalty customers yet. Customers appear here after their first order.
              </p>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCustomers.map((customer) => (
                  <CustomerTile
                    key={customer.id}
                    customer={customer}
                    selected={selected?.id === customer.id}
                    onClick={() => setSelectedId(customer.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {selected && (
            <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-baky-muted">
                    Customer details
                  </p>
                  <h3 className="mt-1 truncate text-lg font-extrabold text-black sm:text-xl">
                    {selected.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{selected.phone}</p>
                </div>
                <div className="rounded-xl bg-white px-4 py-3 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-baky-muted">
                    Current points
                  </p>
                  <p className="text-2xl font-extrabold text-[#31572e]">
                    {selected.points_balance}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <DetailStat label="Completed spend" value={money(customerSpend)} />
                <DetailStat label="Completed orders" value={customerOrders.length.toString()} />
                <DetailStat label="Brownie claims" value={customerClaims.length.toString()} />
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="min-w-0 rounded-xl bg-white p-3 sm:p-4">
                  <h4 className="text-sm font-bold text-gray-900">Points history</h4>
                  {customerLedger.length ? (
                    <div className="mt-2 divide-y divide-gray-100">
                      {customerLedger.map((entry, index) => (
                        <div
                          key={`${entry.customer_id}-${entry.created_at}-${index}`}
                          className="flex justify-between gap-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-800">
                              {entry.description}
                            </p>
                            <p className="mt-0.5 text-[10px] text-gray-500">
                              {new Date(entry.created_at).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 font-extrabold ${entry.points_delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                          >
                            {entry.points_delta > 0 ? "+" : ""}
                            {entry.points_delta}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">No points activity recorded yet.</p>
                  )}
                </div>
                <div className="min-w-0 rounded-xl bg-white p-3 sm:p-4">
                  <h4 className="text-sm font-bold text-gray-900">Free brownie claims</h4>
                  {customerClaims.length ? (
                    <div className="mt-2 divide-y divide-gray-100">
                      {customerClaims.map((claim: LoyaltyClaim) => (
                        <div key={claim.id} className="flex justify-between gap-3 py-2 text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">{claim.reward_name}</p>
                            <p className="mt-0.5 text-[10px] text-gray-500">
                              {new Date(claim.created_at).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                          <span
                            className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${claim.status === "Redeemed" ? "bg-emerald-100 text-emerald-800" : claim.status === "Pending" ? "bg-amber-100 text-amber-900" : "bg-gray-100 text-gray-600"}`}
                          >
                            {claim.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">No brownie claims yet.</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: number;
  note?: string;
  icon: typeof Award;
}) {
  return (
    <article className="rounded-2xl border border-black/5 bg-baky-surface p-4">
      <div className="flex items-center gap-2 text-baky-muted">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-black">{value.toLocaleString("en-IN")}</p>
      {note && <p className="mt-1 text-[11px] text-baky-muted">{note}</p>}
    </article>
  );
}

function CustomerTile({
  customer,
  selected,
  onClick,
}: {
  customer: LoyaltyCustomer;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-w-0 rounded-xl border p-3 text-left transition ${selected ? "border-[#739b51] bg-[#f5f8f1]" : "border-black/5 bg-white hover:border-black/15"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-bold text-gray-900">{customer.name}</span>
        <span className="shrink-0 rounded-full bg-[#eaf4e1] px-2 py-1 text-[10px] font-bold text-[#31572e]">
          {customer.points_balance} pts
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-gray-600">{customer.phone}</p>
      <p className="mt-1 text-[10px] text-gray-400">
        Joined {new Date(customer.created_at).toLocaleDateString("en-IN")}
      </p>
    </button>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-3">
      <p className="truncate text-[10px] font-semibold text-baky-muted">{label}</p>
      <p className="mt-1 truncate text-base font-extrabold text-gray-900">{value}</p>
    </div>
  );
}
