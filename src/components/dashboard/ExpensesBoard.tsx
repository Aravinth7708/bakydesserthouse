import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  Receipt,
  X,
  TrendingDown
} from "lucide-react";

export function ExpensesBoard() {
  const { expenses, addExpense, deleteExpense } = useStore();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Summary Metrics
  const totalAmount = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      return (
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [expenses, search]);

  const handleOpenModal = () => {
    setTitle("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        title: title.trim(),
        category: "Other",
        amount: numAmount,
        paymentMethod: "Cash",
        date,
        notes: notes.trim(),
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Add expense error:", err);
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
            <p className="text-[10px] font-semibold text-baky-muted uppercase tracking-wider">Expense Records</p>
            <p className="text-sm sm:text-base font-extrabold text-black">{expenses.length} Total</p>
          </div>
        </div>
      </div>

      {/* Main Content Area (Flat, No Shadows) */}
      <div className="rounded-[15px] bg-baky-surface p-3 sm:p-5 lg:p-6">
        {/* Control Header & Add Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-baky-muted/30">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-baky-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses by title, notes..."
              className="w-full rounded-xl border border-baky-muted/40 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-black focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-baky-muted hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Add Expense Button */}
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1177E5] px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 active:scale-95 transition-all sm:text-sm shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Add Expense
          </button>
        </div>

        {/* Expenses List / Table */}
        <div className="min-w-0 mt-4">
          <div className="grid grid-cols-12 gap-2 border-b border-baky-muted/40 px-1 pb-2 text-xs font-semibold text-baky-muted uppercase tracking-wider md:text-sm">
            <span className="col-span-3 sm:col-span-3">Date</span>
            <span className="col-span-6 sm:col-span-6">Expense Title & Purpose</span>
            <span className="col-span-3 sm:col-span-3 text-right">Amount & Action</span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-10 w-10 text-baky-muted/60 mb-2" />
              <p className="text-sm font-semibold text-black">No expenses found</p>
              <p className="text-xs text-baky-muted mt-1 max-w-sm">
                {search
                  ? "Try resetting your search query or add a new expense."
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
            <ul className="divide-y divide-baky-muted/20">
              {filteredExpenses.map((exp) => (
                <li
                  key={exp.id}
                  className="grid grid-cols-12 items-center gap-2 px-1 py-3 text-xs font-medium text-black md:py-4 md:text-base transition-colors hover:bg-baky-card/30"
                >
                  {/* Date */}
                  <div className="col-span-3 sm:col-span-3 flex items-center gap-1.5 text-black/80 truncate">
                    <Calendar className="h-3.5 w-3.5 text-baky-muted shrink-0 hidden sm:inline" />
                    <span className="font-semibold text-black">{exp.date}</span>
                  </div>

                  {/* Title & Notes */}
                  <div className="col-span-6 sm:col-span-6 min-w-0 pr-2">
                    <p className="font-bold text-black truncate">{exp.title}</p>
                    {exp.notes && (
                      <p className="text-[11px] md:text-xs text-baky-muted truncate font-normal mt-0.5" title={exp.notes}>
                        {exp.notes}
                      </p>
                    )}
                  </div>

                  {/* Amount & Actions */}
                  <div className="col-span-3 sm:col-span-3 flex items-center justify-end gap-2.5 min-w-0">
                    <span className="font-extrabold text-black text-sm md:text-lg">
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </span>
                    <button
                      onClick={() => handleDelete(exp.id, exp.title)}
                      className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors shrink-0"
                      title={`Delete expense ${exp.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
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
                  <h3 className="text-lg font-extrabold text-black sm:text-xl">
                    Add New Expense
                  </h3>
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

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Amount (₹) *
                  </label>
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
                  <label className="block text-xs font-bold text-black mb-1">
                    Date *
                  </label>
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
