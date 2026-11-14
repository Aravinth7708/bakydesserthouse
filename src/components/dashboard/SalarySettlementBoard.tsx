import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  History,
  Plus,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useStore, type SalaryPayment, type StaffMember } from "@/lib/store";
import { formatPay, localDateKey } from "@/lib/staff-attendance";

type StaffSalarySummary = {
  staff: StaffMember;
  earned: number;
  paid: number;
  balance: number;
  payments: SalaryPayment[];
};

function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SalarySettlementBoard() {
  const { expenses, salaryPayments, staff, recordSalaryPayment } = useStore();
  const [month, setMonth] = useState(() => localDateKey(new Date()).slice(0, 7));
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);

  const summaries = useMemo<StaffSalarySummary[]>(() => {
    const monthPayments = salaryPayments.filter((payment) => payment.salaryMonth === month);
    return staff.map((member) => {
      const earned = expenses
        .filter(
          (expense) =>
            expense.category === "Salary" &&
            expense.date.startsWith(month) &&
            expense.id.startsWith("attendance_salary_") &&
            expense.id.endsWith(`_${member.id}`),
        )
        .reduce((total, expense) => total + expense.amount, 0);
      const payments = monthPayments.filter((payment) => payment.staffId === member.id);
      const paid = payments.reduce((total, payment) => total + payment.amount, 0);
      return { staff: member, earned, paid, balance: earned - paid, payments };
    });
  }, [expenses, salaryPayments, staff, month]);

  const totalEarned = summaries.reduce((sum, summary) => sum + summary.earned, 0);
  const totalPaid = summaries.reduce((sum, summary) => sum + summary.paid, 0);
  const totalDue = summaries.reduce((sum, summary) => sum + Math.max(0, summary.balance), 0);
  const advanceCarry = summaries.reduce((sum, summary) => sum + Math.max(0, -summary.balance), 0);
  const monthHistory = salaryPayments
    .filter((payment) => payment.salaryMonth === month)
    .sort(
      (a, b) =>
        b.paidOn.localeCompare(a.paidOn) || (b.createdAt || "").localeCompare(a.createdAt || ""),
    );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6 sm:space-y-6">
      <section className="rounded-2xl border border-black/10 bg-gradient-to-br from-[#f5f1f8] via-white to-[#eef8e6] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#795789]">
              Staff payroll
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Salary settlement
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              Track each staff member’s earned salary, advances received, and remaining amount to
              settle.
            </p>
          </div>
          <label className="flex w-full items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 sm:w-auto">
            <CalendarDays className="h-5 w-5 shrink-0 text-[#795789]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-black/45">
                Salary month
              </span>
              <input
                aria-label="Salary month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="mt-0.5 w-full bg-transparent text-sm font-bold text-black outline-none sm:w-40"
              />
            </span>
          </label>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Banknote}
          label="Salary earned"
          value={formatPay(totalEarned)}
          detail={monthLabel(month)}
          tone="violet"
        />
        <SummaryCard
          icon={ArrowDownLeft}
          label="Advances & paid"
          value={formatPay(totalPaid)}
          detail="Recorded for this month"
          tone="amber"
        />
        <SummaryCard
          icon={WalletCards}
          label="Still to settle"
          value={formatPay(totalDue)}
          detail="Remaining salary due"
          tone="green"
        />
        <SummaryCard
          icon={CircleDollarSign}
          label="Advance balance"
          value={formatPay(advanceCarry)}
          detail="Advance above earned salary"
          tone="blue"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold sm:text-xl">Staff balances</h3>
            <p className="mt-0.5 text-xs text-black/50">
              Attendance wages less payments for {monthLabel(month)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/50">
            <Users className="h-4 w-4" /> {summaries.length} staff
          </span>
        </div>

        {summaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-black/25" />
            <p className="mt-3 font-semibold">No staff profiles yet</p>
            <p className="mt-1 text-sm text-black/50">
              Add staff in Manage to start tracking salary.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {summaries.map((summary) => (
              <StaffSalaryCard
                key={summary.staff.id}
                summary={summary}
                onRecord={() => setSelectedStaff(summary.staff)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-4 sm:px-5">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold sm:text-lg">
              <History className="h-5 w-5 text-[#795789]" /> Payment history
            </h3>
            <p className="mt-0.5 text-xs text-black/50">
              Advances and salary payments in {monthLabel(month)}
            </p>
          </div>
          <span className="rounded-full bg-[#f5f1f8] px-2.5 py-1 text-xs font-bold text-[#624274]">
            {monthHistory.length} records
          </span>
        </div>
        {monthHistory.length ? (
          <div className="divide-y divide-black/5">
            {monthHistory.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      payment.type === "Advance"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {payment.type === "Advance" ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <WalletCards className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-black">
                      {payment.staffName} · {payment.type}
                    </span>
                    <span className="mt-0.5 block text-xs text-black/50">
                      {dateLabel(payment.paidOn)}
                      {payment.notes ? ` · ${payment.notes}` : ""}
                    </span>
                  </span>
                </div>
                <strong className="pl-[52px] text-sm font-extrabold tabular-nums text-black sm:pl-0">
                  {formatPay(payment.amount)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center sm:px-5">
            <Clock3 className="mx-auto h-7 w-7 text-black/25" />
            <p className="mt-2 text-sm font-semibold">
              No payments recorded for {monthLabel(month)}
            </p>
            <p className="mt-1 text-xs text-black/50">
              Add an advance or record a salary settlement to begin the history.
            </p>
          </div>
        )}
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-black/45">
        Salary earned is calculated from attendance wages. Advances and settlements are tracked here
        and reduce the remaining balance; they are not added to expenses a second time.
      </p>

      {selectedStaff && (
        <SalaryPaymentDialog
          staff={selectedStaff}
          salaryMonth={month}
          onClose={() => setSelectedStaff(null)}
          saving={saving}
          onSave={async (payment) => {
            setSaving(true);
            try {
              await recordSalaryPayment(payment);
              setSelectedStaff(null);
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  detail: string;
  tone: "violet" | "amber" | "green" | "blue";
}) {
  const tones = {
    violet: "bg-[#f5f1f8] text-[#704d84]",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs font-semibold text-black/55">{label}</span>
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight tabular-nums text-black">{value}</p>
      <p className="mt-1 text-[11px] text-black/45">{detail}</p>
    </article>
  );
}

function StaffSalaryCard({
  summary,
  onRecord,
}: {
  summary: StaffSalarySummary;
  onRecord: () => void;
}) {
  const balancePositive = summary.balance >= 0;
  return (
    <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-bold sm:text-lg">{summary.staff.name}</h4>
          <p className="mt-0.5 text-xs text-black/50">{summary.staff.phone}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs ${
            balancePositive
              ? summary.balance > 0
                ? "bg-amber-50 text-amber-800"
                : "bg-emerald-50 text-emerald-800"
              : "bg-violet-50 text-violet-800"
          }`}
        >
          {!balancePositive ? "Advance balance" : summary.balance > 0 ? "Due" : "Settled"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#fafafa] p-3">
        <MoneyMetric label="Earned" amount={summary.earned} />
        <MoneyMetric label="Paid" amount={summary.paid} />
        <MoneyMetric
          label={balancePositive ? "Due" : "Advance"}
          amount={Math.abs(summary.balance)}
          emphasize
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-black/50">
          {summary.payments.length} payment{summary.payments.length === 1 ? "" : "s"} this month
        </p>
        <button
          type="button"
          onClick={onRecord}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-black px-3 py-2 text-xs font-bold text-white transition hover:bg-black/80 sm:px-4 sm:text-sm"
        >
          <Plus className="h-4 w-4" /> Record payment
        </button>
      </div>
    </article>
  );
}

function MoneyMetric({
  label,
  amount,
  emphasize = false,
}: {
  label: string;
  amount: number;
  emphasize?: boolean;
}) {
  return (
    <span className="min-w-0">
      <span className="block text-[9px] font-bold uppercase tracking-wide text-black/45 sm:text-[10px]">
        {label}
      </span>
      <strong
        className={`mt-1 block truncate text-xs tabular-nums sm:text-sm ${emphasize ? "text-black" : "text-black/75"}`}
      >
        {formatPay(amount)}
      </strong>
    </span>
  );
}

function SalaryPaymentDialog({
  staff,
  salaryMonth,
  onClose,
  onSave,
  saving,
}: {
  staff: StaffMember;
  salaryMonth: string;
  onClose: () => void;
  onSave: (payment: Omit<SalaryPayment, "id" | "createdAt">) => Promise<void>;
  saving: boolean;
}) {
  const [type, setType] = useState<SalaryPayment["type"]>("Advance");
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(localDateKey(new Date()));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setError("");
    try {
      await onSave({
        staffId: staff.id,
        staffName: staff.name,
        salaryMonth,
        type,
        amount: value,
        paidOn,
        notes: notes.trim(),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this payment.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#795789]">
              {monthLabel(salaryMonth)}
            </p>
            <h3 className="mt-1 text-xl font-extrabold">Record salary payment</h3>
            <p className="mt-1 text-sm text-black/55">For {staff.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-black/50 transition hover:bg-black/5 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[#f7f7f7] p-1.5">
          {(["Advance", "Settlement"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              aria-pressed={type === option}
              className={`min-h-10 rounded-lg px-3 text-sm font-bold transition ${
                type === option ? "bg-white text-black shadow-sm" : "text-black/55 hover:text-black"
              }`}
            >
              {option === "Advance" ? "Advance paid" : "Salary settlement"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-xs font-bold text-black">
            Amount paid
            <span className="relative mt-1.5 block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/45">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                className="h-12 w-full rounded-xl border border-black/15 bg-white pl-8 pr-3 text-base font-bold text-black outline-none focus:border-[#795789] focus:ring-2 focus:ring-[#795789]/15"
              />
            </span>
          </label>
          <label className="block text-xs font-bold text-black">
            Payment date
            <input
              type="date"
              required
              value={paidOn}
              onChange={(event) => setPaidOn(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm font-medium text-black outline-none focus:border-[#795789]"
            />
          </label>
          <label className="block text-xs font-bold text-black">
            Note <span className="font-medium text-black/45">(optional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder={
                type === "Advance" ? "e.g. Advance requested for travel" : "e.g. Paid in cash"
              }
              className="mt-1.5 w-full resize-y rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm font-medium text-black outline-none focus:border-[#795789]"
            />
          </label>
        </div>

        {type === "Advance" && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
            This advance will be deducted from {staff.name}’s salary balance for{" "}
            {monthLabel(salaryMonth)}.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-black hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 flex-1 rounded-xl bg-[#1177E5] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0b62be] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : type === "Advance" ? "Record advance" : "Record settlement"}
          </button>
        </div>
      </form>
    </div>
  );
}
