import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  PackageCheck,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import { useStore, type Expense, type Order } from "@/lib/store";

const periods = ["This month", "Today", "Yesterday", "Last month", "All time"] as const;
type AnalysisPeriod = (typeof periods)[number];

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function matchesPeriod(date: Date, period: AnalysisPeriod) {
  const key = localDateKey(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  if (period === "All time") return true;
  if (period === "Today") return key === localDateKey(today);
  if (period === "Yesterday") return key === localDateKey(yesterday);
  if (period === "This month") return key.startsWith(localDateKey(today).slice(0, 7));
  return key.startsWith(localDateKey(lastMonth).slice(0, 7));
}

function paidOrderAmount(order: Order) {
  if (order.status !== "Past Orders" || order.paymentMethod === "Nil") return 0;
  if (order.paymentMethod === "Split Payment") {
    const cash = Number(
      order.paymentDetails?.match(/Cash:\s*₹?([\d,.]+)/i)?.[1]?.replaceAll(",", "") ?? 0,
    );
    const gpay = Number(
      order.paymentDetails?.match(/GPay:\s*₹?([\d,.]+)/i)?.[1]?.replaceAll(",", "") ?? 0,
    );
    return cash + gpay;
  }
  return ["Cash", "GPay", "Online Orders"].includes(order.paymentMethod || "") ? order.total : 0;
}

function rupees(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function orderDate(order: Order) {
  if (!order.createdAt) return null;
  const date = new Date(order.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function analysisExpenseCategory(expense: Expense) {
  if (expense.category !== "Other") return expense.category;
  const details = `${expense.title} ${expense.notes || ""}`.toLowerCase();
  if (/\b(fuel|petrol|diesel|gasoline)\b/.test(details)) return "Fuel";
  if (/\b(salary|wage|payroll|staff pay|attendance)\b/.test(details)) return "Salary";
  if (/\b(water|electricity|electric|utility|utilities|power bill)\b/.test(details)) {
    return "Water & Utilities";
  }
  if (/\b(repair|maintenance|service charge)\b/.test(details)) return "Maintenance & Repair";
  if (/\b(stock|ingredient|chocolate|flour|sugar|milk|cream|butter)\b/.test(details)) {
    return "Stock / Ingredients";
  }
  return expense.category;
}

export function AnalysisBoard() {
  const { orders, expenses } = useStore();
  const [period, setPeriod] = useState<AnalysisPeriod>("This month");

  const analysis = useMemo(() => {
    const itemTotals = new Map<string, { name: string; quantity: number; sales: number }>();
    let sales = 0;
    let paidOrders = 0;
    let unitsSold = 0;

    for (const order of orders) {
      const date = orderDate(order);
      const paid = paidOrderAmount(order);
      if (!date || !matchesPeriod(date, period) || paid <= 0) continue;
      sales += paid;
      paidOrders += 1;
      const subtotal = order.lines.reduce((sum, line) => sum + line.price * line.qty, 0);
      const takeaway = Number(
        order.paymentDetails?.match(/Takeaway charges:\s*₹?([\d,.]+)/i)?.[1]?.replaceAll(",", "") ??
          0,
      );
      const itemSalesTotal = Math.max(0, paid - takeaway);
      for (const line of order.lines) {
        const name = line.variant ? `${line.name} · ${line.variant}` : line.name;
        const key = name.toLowerCase();
        const amount = subtotal > 0 ? (itemSalesTotal * line.price * line.qty) / subtotal : 0;
        const current = itemTotals.get(key) || { name, quantity: 0, sales: 0 };
        current.quantity += line.qty;
        current.sales += amount;
        unitsSold += line.qty;
        itemTotals.set(key, current);
      }
    }

    const periodExpenses = expenses.filter((expense) => {
      const date = new Date(`${expense.date}T12:00:00`);
      return !Number.isNaN(date.getTime()) && matchesPeriod(date, period);
    });
    const categoryTotals = new Map<string, number>();
    for (const expense of periodExpenses) {
      const category = analysisExpenseCategory(expense);
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + expense.amount);
    }

    const items = [...itemTotals.values()].sort(
      (a, b) => b.quantity - a.quantity || b.sales - a.sales,
    );
    const categories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
    const expenseTotal = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const highestExpenses = [...periodExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
    return {
      sales,
      paidOrders,
      unitsSold,
      items,
      expenseTotal,
      expenseCount: periodExpenses.length,
      categories,
      highestExpenses,
      net: sales - expenseTotal,
    };
  }, [orders, expenses, period]);

  const maxItemQuantity = Math.max(1, ...analysis.items.map((item) => item.quantity));
  const maxCategoryAmount = Math.max(1, ...analysis.categories.map(([, amount]) => amount));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-6 sm:gap-5">
      <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-baky-muted">
              Baky Dessert House
            </p>
            <h2 className="mt-1 text-xl font-bold text-black sm:text-2xl">
              Sales & Expense Analysis
            </h2>
            <p className="mt-1 text-sm text-baky-muted">
              See your best-selling items and where expenses are highest.
            </p>
          </div>
          <label className="flex h-11 items-center gap-2 self-start rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-black sm:self-auto">
            <CalendarDays className="h-4 w-4 text-baky-muted" />
            <span className="sr-only">Analysis period</span>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as AnalysisPeriod)}
              className="min-w-0 bg-transparent outline-none"
            >
              {periods.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Paid sales"
          value={rupees(analysis.sales)}
          note={`${analysis.paidOrders} paid orders`}
          tone="sales"
        />
        <SummaryCard
          label="Units sold"
          value={analysis.unitsSold.toLocaleString("en-IN")}
          note="Across paid orders"
          tone="items"
        />
        <SummaryCard
          label="Expenses"
          value={rupees(analysis.expenseTotal)}
          note={`${analysis.expenseCount} expense records`}
          tone="expenses"
        />
        <SummaryCard
          label="Net balance"
          value={rupees(analysis.net)}
          note="Sales minus expenses"
          tone={analysis.net >= 0 ? "net" : "loss"}
        />
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-3">
            <div>
              <h3 className="text-base font-bold text-black sm:text-lg">Best-selling items</h3>
              <p className="mt-0.5 text-xs text-baky-muted">
                Ranked by quantity sold, with sales value
              </p>
            </div>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          {analysis.items.length === 0 ? (
            <EmptyAnalysis message="No paid item sales in this period." />
          ) : (
            <div className="mt-3 space-y-3">
              {analysis.items.slice(0, 10).map((item, index) => (
                <div key={item.name} className="rounded-xl bg-white p-3 sm:p-3.5">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-baky-surface text-xs font-bold text-baky-muted">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-semibold text-black">{item.name}</span>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-black">
                      {item.quantity} sold
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 pl-9">
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.max(4, (item.quantity / maxItemQuantity) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs font-semibold text-emerald-800">
                      {rupees(item.sales)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-baky-muted">
            Item sales values exclude takeaway charges and are allocated according to item prices.
          </p>
        </section>

        <section className="min-w-0 rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-3">
            <div>
              <h3 className="text-base font-bold text-black sm:text-lg">Expense breakdown</h3>
              <p className="mt-0.5 text-xs text-baky-muted">
                Categories ordered from highest spend
              </p>
            </div>
            <span className="rounded-xl bg-rose-50 p-2 text-rose-700">
              <ReceiptText className="h-5 w-5" />
            </span>
          </div>
          {analysis.categories.length === 0 ? (
            <EmptyAnalysis message="No expenses recorded in this period." />
          ) : (
            <div className="mt-3 space-y-3">
              {analysis.categories.map(([category, amount], index) => (
                <div key={category} className="rounded-xl bg-white p-3 sm:p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-baky-surface text-xs font-bold text-baky-muted">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-semibold text-black">{category}</span>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-rose-700">
                      {rupees(amount)}
                    </span>
                  </div>
                  <div className="mt-2 pl-9">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${Math.max(4, (amount / maxCategoryAmount) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-baky-muted">
                      {analysis.expenseTotal
                        ? Math.round((amount / analysis.expenseTotal) * 100)
                        : 0}
                      % of expenses
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
        <div className="flex items-center gap-3 border-b border-black/10 pb-3">
          <span className="rounded-xl bg-amber-50 p-2 text-amber-700">
            <ArrowDownRight className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-black sm:text-lg">
              Highest individual expenses
            </h3>
            <p className="mt-0.5 text-xs text-baky-muted">
              Largest expense records for {period.toLowerCase()}
            </p>
          </div>
        </div>
        {analysis.highestExpenses.length === 0 ? (
          <EmptyAnalysis message="No expense records in this period." />
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {analysis.highestExpenses.map((expense, index) => (
              <article key={expense.id} className="min-w-0 rounded-xl bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-baky-muted">
                    #{index + 1} highest
                  </span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                    {analysisExpenseCategory(expense)}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-black" title={expense.title}>
                  {expense.title}
                </p>
                <p className="mt-1 text-xs text-baky-muted">
                  {new Date(`${expense.date}T12:00:00`).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <p className="mt-2 text-lg font-extrabold text-rose-700">
                  {rupees(expense.amount)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "sales" | "items" | "expenses" | "net" | "loss";
}) {
  const color =
    tone === "sales" || tone === "net"
      ? "text-emerald-800"
      : tone === "expenses" || tone === "loss"
        ? "text-rose-700"
        : "text-[#1177E5]";
  const Icon =
    tone === "sales"
      ? ArrowUpRight
      : tone === "items"
        ? PackageCheck
        : tone === "expenses" || tone === "loss"
          ? ArrowDownRight
          : ChartNoAxesCombined;
  return (
    <article className="min-w-0 rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
      <div className="flex items-center gap-2 text-baky-muted">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate text-xs font-semibold">{label}</span>
      </div>
      <p className={`mt-2 truncate text-2xl font-extrabold sm:text-3xl ${color}`}>{value}</p>
      <p className="mt-1 truncate text-xs text-baky-muted">{note}</p>
    </article>
  );
}

function EmptyAnalysis({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-black/10 bg-white px-4 py-8 text-center text-sm text-baky-muted">
      {message}
    </div>
  );
}
