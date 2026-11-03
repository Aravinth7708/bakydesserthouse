import { useState, useMemo, useEffect } from "react";
import { useStore, type ExpenseCategory } from "@/lib/store";
import { Plus, Trash2, Search, Calendar, Receipt, X, TrendingDown, ImagePlus } from "lucide-react";

const expenseCategories: ExpenseCategory[] = [
  "Fuel",
  "Stock / Ingredients",
  "Water & Utilities",
  "Maintenance & Repair",
  "Salary",
  "Other",
];

type DateFilter = "All dates" | "Today" | "Yesterday" | "This month" | "Last month";

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function matchesDateFilter(date: string, filter: DateFilter) {
  if (filter === "All dates") return true;
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  if (filter === "Today") return date === localDateKey(now);
  if (filter === "Yesterday") return date === localDateKey(yesterday);
  if (filter === "This month") return date.startsWith(localDateKey(now).slice(0, 7));
  return date.startsWith(localDateKey(lastMonth).slice(0, 7));
}

export function ExpensesBoard() {
  const { expenses, addExpense, deleteExpense } = useStore();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("Today");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Other");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreview("");
      return;
    }
    const previewUrl = URL.createObjectURL(receiptFile);
    setReceiptPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [receiptFile]);

  // Summary Metrics
  const totalAmount = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchesSearch =
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())) ||
          e.category.toLowerCase().includes(search.toLowerCase());
        return matchesSearch && matchesDateFilter(e.date, dateFilter);
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""),
      );
  }, [expenses, search, dateFilter]);

  const expenseDateGroups = useMemo(() => {
    const now = new Date();
    const dateKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const today = dateKey(now);
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = dateKey(yesterdayDate);
    const grouped = new Map<string, typeof filteredExpenses>();
    filteredExpenses.forEach((expense) => {
      grouped.set(expense.date, [...(grouped.get(expense.date) || []), expense]);
    });

    return [...grouped.entries()].map(([date, records]) => ({
      date,
      title:
        date === today
          ? "Today"
          : date === yesterday
            ? "Yesterday"
            : new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
      records,
      total: records.reduce((sum, expense) => sum + expense.amount, 0),
    }));
  }, [filteredExpenses]);

  const handleOpenModal = () => {
    setTitle("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setCategory("Other");
    setReceiptFile(null);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;
    setFormError("");

    setIsSubmitting(true);
    try {
      await addExpense({
        title: title.trim(),
        category,
        amount: numAmount,
        paymentMethod: "Cash",
        date,
        notes: notes.trim(),
        receiptFile: receiptFile ?? undefined,
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Add expense error:", err);
      setFormError(err instanceof Error ? err.message : "Could not save the expense receipt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete expense "${title}"?`)) {
      await deleteExpense(id);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-6">
      {/* Top Stat Overview - Total Expenses Only (Flat, No Shadows) */}
      <div className="rounded-[15px] bg-baky-surface p-4 sm:p-5 lg:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-baky-muted uppercase tracking-wider sm:text-sm">
              Total Expenses
            </p>
            <p className="text-2xl font-black text-black sm:text-3xl lg:text-4xl mt-0.5">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-baky-muted/20">
          <div className="rounded-xl bg-baky-card px-4 py-2 text-center">
            <p className="text-[10px] font-semibold text-baky-muted uppercase tracking-wider">
              Expense Records
            </p>
            <p className="text-sm sm:text-base font-extrabold text-black">
              {expenses.length} Total
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area (Flat, No Shadows) */}
      <div className="rounded-[15px] bg-baky-surface p-3 sm:p-5 lg:p-6">
        {/* Control Header & Add Button */}
        <div className="flex flex-col gap-3 border-b border-baky-muted/30 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-baky-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, notes, or category..."
                className="w-full rounded-xl border border-baky-muted/40 bg-white py-2.5 pl-10 pr-10 text-xs font-medium text-black focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-baky-muted hover:text-black"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleOpenModal}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1177E5] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 active:scale-95 sm:text-sm"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Add Expense
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-baky-muted/30 bg-white px-3 text-xs font-semibold text-black sm:text-sm">
              <Calendar className="h-4 w-4 text-baky-muted" />
              <span className="sr-only">Filter expenses by date</span>
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                className="max-w-[220px] bg-transparent outline-none"
              >
                <option value="All dates">All dates</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This month">This month</option>
                <option value="Last month">Last month</option>
              </select>
            </label>
            <p className="text-xs text-baky-muted">
              Showing <span className="font-bold text-black">{filteredExpenses.length}</span> of{" "}
              {expenses.length} records · newest first
            </p>
          </div>
        </div>

        {/* Expense cards */}
        <div className="min-w-0 mt-4">
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-10 w-10 text-baky-muted/60 mb-2" />
              <p className="text-sm font-semibold text-black">No expenses found</p>
              <p className="text-xs text-baky-muted mt-1 max-w-sm">
                {search || dateFilter !== "All dates"
                  ? "Adjust the search or date filter to find an expense."
                  : "Start recording expenses like fuel, chocolates, stock, or water bills!"}
              </p>
              <button
                onClick={handleOpenModal}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-[#1177E5] hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {expenseDateGroups.map((group) => (
                <section key={group.date}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-3 sm:px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1177E5]">
                        <Calendar className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-black">{group.title}</h3>
                        <p className="text-[11px] text-baky-muted">
                          {group.records.length}{" "}
                          {group.records.length === 1 ? "expense" : "expenses"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-extrabold text-black">
                      Day total: ₹{Math.round(group.total).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.records.map((exp) => (
                      <li
                        key={exp.id}
                        className="flex min-w-0 flex-col justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:border-black/10 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-800">
                              {exp.category}
                            </span>
                            {exp.paymentMethod && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                                {exp.paymentMethod}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(exp.id, exp.title)}
                            aria-label={`Delete expense ${exp.title}`}
                            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 min-w-0 flex-1">
                          <p className="break-words text-sm font-bold text-black sm:text-base">
                            {exp.title}
                          </p>
                          {exp.notes && (
                            <p
                              className="mt-1 line-clamp-2 break-words text-xs text-baky-muted"
                              title={exp.notes}
                            >
                              {exp.notes}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 flex items-end justify-between gap-2 border-t border-black/5 pt-3">
                          {exp.receiptUrl ? (
                            <a
                              href={exp.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1177E5] hover:underline"
                            >
                              <Receipt className="h-3.5 w-3.5" /> View receipt
                            </a>
                          ) : (
                            <span className="text-xs text-baky-muted">No receipt attached</span>
                          )}
                          <span className="shrink-0 text-lg font-extrabold text-black sm:text-xl">
                            ₹{Math.round(exp.amount).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-4 transition-all sm:p-6 my-auto max-h-[90vh] flex flex-col min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1177E5]/10 text-[#1177E5]">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-black sm:text-xl">Add New Expense</h3>
                  <p className="text-xs font-medium text-baky-muted">
                    Record fuel, stock, water, or shop operational costs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 flex-1 overflow-y-auto pr-1">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Expense Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fuel for delivery bike, Chocolate stock, Water cans"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-black focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-black">Category *</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-black focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
                >
                  {expenseCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-black">
                  Receipt photo <span className="font-medium text-baky-muted">(Optional)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 transition hover:border-[#1177E5] hover:bg-blue-50/40">
                  {receiptPreview ? (
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-[#1177E5]">
                      <ImagePlus className="h-6 w-6" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-black sm:text-sm">
                      {receiptFile?.name || "Choose receipt photo"}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-baky-muted">
                      JPG, PNG or WebP · up to 5 MB
                    </span>
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                        setFormError("Choose a JPG, PNG, or WebP image.");
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        setFormError("Receipt photo must be 5 MB or smaller.");
                        return;
                      }
                      setFormError("");
                      setReceiptFile(file);
                    }}
                  />
                </label>
                {receiptFile && (
                  <button
                    type="button"
                    onClick={() => setReceiptFile(null)}
                    className="mt-1 text-[11px] font-semibold text-rose-700 hover:underline"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-bold text-black focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-black focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
                  />
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Vendor name, petrol pump location, invoice receipt no."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-black focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5]"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-gray-50 transition-colors sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1177E5] px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 active:scale-95 disabled:opacity-50 transition-all sm:text-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
              {formError && (
                <p role="alert" className="text-xs font-semibold text-rose-700">
                  {formError}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
