import { useState, useMemo } from "react";
import { useStore, type ExpenseCategory, type Expense } from "@/lib/store";
import { 
  Plus, 
  Trash2, 
  Search, 
  Fuel, 
  Package, 
  Droplets, 
  Wrench, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Receipt,
  X,
  TrendingDown,
  Tag
} from "lucide-react";

const CATEGORIES: { label: ExpenseCategory; icon: any; color: string; bgColor: string; borderColor: string }[] = [
  { label: "Fuel", icon: Fuel, color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  { label: "Stock / Ingredients", icon: Package, color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  { label: "Water & Utilities", icon: Droplets, color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  { label: "Maintenance & Repair", icon: Wrench, color: "text-rose-700", bgColor: "bg-rose-50", borderColor: "border-rose-200" },
  { label: "Salary", icon: DollarSign, color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  { label: "Other", icon: Tag, color: "text-gray-700", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
];

export function ExpensesBoard() {
  const { expenses, addExpense, deleteExpense } = useStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Fuel");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Summary Metrics
  const totalAmount = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch = 
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())) ||
        e.category.toLowerCase().includes(search.toLowerCase());
      
      const matchesCat = selectedCategory === "All" || e.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [expenses, search, selectedCategory]);

  const handleOpenModal = () => {
    setTitle("");
    setCategory("Fuel");
    setAmount("");
    setPaymentMethod("Cash");
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
        category,
        amount: numAmount,
        paymentMethod,
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

  const getCategoryBadge = (catName: ExpenseCategory) => {
    const config = CATEGORIES.find((c) => c.label === catName) || CATEGORIES[5];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full ${config.bgColor} px-2.5 py-1 text-xs font-bold ${config.color} border ${config.borderColor}`}>
        <Icon className="h-3.5 w-3.5" />
        {catName}
      </span>
    );
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
      {/* Top Stat Overview - Total Expenses Only */}
      <div className="rounded-[15px] bg-baky-card p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-sm">
            <TrendingDown className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-baky-muted uppercase tracking-wider sm:text-sm">
              Total Expenses
            </p>
            <p className="text-3xl font-black text-gray-900 sm:text-4xl mt-0.5">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/70">
          <div className="rounded-xl bg-white/80 px-4 py-2 text-center border border-gray-200/80 shadow-xs">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Expense Records</p>
            <p className="text-base font-extrabold text-gray-900">{expenses.length} Total</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="rounded-[15px] bg-baky-surface p-4 sm:p-6 shadow-sm border border-gray-100">
        {/* Control Header & Add Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses by title, category, notes..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Add Expense Button */}
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1177E5] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-600 active:scale-95 transition-all sm:text-sm shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Add Expense
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="my-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
              selectedCategory === "All"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Categories ({expenses.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = expenses.filter((e) => e.category === cat.label).length;
            const isSelected = selectedCategory === cat.label;
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : cat.color}`} />
                {cat.label}
                {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Expenses List / Table */}
        <div className="min-w-0">
          <div className="grid grid-cols-12 gap-2 border-b border-gray-200 px-2 pb-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span className="col-span-3 sm:col-span-2">Date</span>
            <span className="col-span-4 sm:col-span-4">Expense Title</span>
            <span className="col-span-3 sm:col-span-3">Category</span>
            <span className="col-span-2 sm:col-span-3 text-right">Amount & Action</span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-700">No expenses found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {search || selectedCategory !== "All"
                  ? "Try resetting your search filter or add a new expense."
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
            <ul className="divide-y divide-gray-100">
              {filteredExpenses.map((exp) => (
                <li
                  key={exp.id}
                  className="grid grid-cols-12 items-center gap-2 px-2 py-3.5 text-xs font-medium text-gray-900 transition-colors hover:bg-gray-50/80 sm:text-sm"
                >
                  {/* Date */}
                  <div className="col-span-3 sm:col-span-2 flex items-center gap-1.5 text-gray-600 truncate">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0 hidden sm:inline" />
                    <span className="font-semibold text-gray-700">{exp.date}</span>
                  </div>

                  {/* Title & Notes */}
                  <div className="col-span-4 sm:col-span-4 min-w-0 pr-2">
                    <p className="font-bold text-gray-900 truncate">{exp.title}</p>
                    {exp.notes && (
                      <p className="text-[11px] text-gray-500 truncate font-normal mt-0.5" title={exp.notes}>
                        {exp.notes}
                      </p>
                    )}
                  </div>

                  {/* Category & Payment Method */}
                  <div className="col-span-3 sm:col-span-3 flex flex-col sm:flex-row sm:items-center gap-1 min-w-0">
                    {getCategoryBadge(exp.category)}
                    {exp.paymentMethod && (
                      <span className="inline-block text-[10px] text-gray-500 font-medium">
                        • {exp.paymentMethod}
                      </span>
                    )}
                  </div>

                  {/* Amount & Actions */}
                  <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-3 min-w-0">
                    <span className="font-extrabold text-gray-900 text-sm sm:text-base">
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
            className="relative w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl transition-all sm:p-6 my-auto max-h-[90vh] flex flex-col min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1177E5]/10 text-[#1177E5]">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 sm:text-xl">
                    Add New Expense
                  </h3>
                  <p className="text-xs font-medium text-gray-500">
                    Record fuel, stock, water, or shop operational costs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 flex-1 overflow-y-auto pr-1">
              {/* Category Options */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.label;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all ${
                          cat.bgColor
                        } ${
                          isSelected
                            ? cat.borderColor + " ring-2 ring-blue-500/20 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${cat.color}`} />
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Expense Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fuel for delivery bike, Chocolate stock, Water cans"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
                />
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] sm:text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="GPay">GPay / UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Split Payment">Split Payment</option>
                  <option value="Nil">Nil (Unpaid / Pending)</option>
                </select>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Vendor name, petrol pump location, invoice receipt no."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5]"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1177E5] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-600 active:scale-95 disabled:opacity-50 transition-all sm:text-sm"
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
