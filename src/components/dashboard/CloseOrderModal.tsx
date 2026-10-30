import { useState, useEffect } from "react";
import { Order, PaymentMethod, useStore } from "@/lib/store";
import { X, CreditCard, Banknote, Smartphone, Globe, Split, AlertCircle, Check } from "lucide-react";

interface CloseOrderModalProps {
  order: Order | null;
  onClose: () => void;
}

export function CloseOrderModal({ order, onClose }: CloseOrderModalProps) {
  const { closeOrder } = useStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("Cash");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [gpayAmount, setGpayAmount] = useState<number>(0);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const payableTotal = order ? order.total + (isTakeaway ? 10 : 0) : 0;

  useEffect(() => {
    if (order) {
      const half = Math.round(order.total / 2);
      setCashAmount(half);
      setGpayAmount(order.total - half);
      setSelectedMethod("Cash");
      setIsTakeaway(false);
    }
  }, [order]);

  if (!order) return null;

  const handleCashChange = (val: number) => {
    const cash = Math.max(0, val);
    setCashAmount(cash);
    setGpayAmount(Math.max(0, payableTotal - cash));
  };

  const handleGpayChange = (val: number) => {
    const gpay = Math.max(0, val);
    setGpayAmount(gpay);
    setCashAmount(Math.max(0, payableTotal - gpay));
  };

  const setHalfSplit = () => {
    const half = Math.round(payableTotal / 2);
    setCashAmount(half);
    setGpayAmount(payableTotal - half);
  };

  const handleTakeawayChange = (checked: boolean) => {
    const nextTotal = order.total + (checked ? 10 : 0);
    const nextCash = Math.min(cashAmount, nextTotal);
    setCashAmount(nextCash);
    setGpayAmount(nextTotal - nextCash);
    setIsTakeaway(checked);
  };

  const isSplitValid = selectedMethod !== "Split Payment" || (cashAmount + gpayAmount === payableTotal);

  const handleConfirm = async () => {
    if (!order || !isSplitValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const detailParts: string[] = [];
      if (isTakeaway) detailParts.push("Takeaway charges: ₹10");
      if (selectedMethod === "Split Payment") {
        detailParts.push(`Cash: ₹${cashAmount}, GPay: ₹${gpayAmount}`);
      } else if (selectedMethod === "Nil") {
        detailParts.push("Item given without payment (Unpaid)");
      }

      await closeOrder(order.id, selectedMethod, detailParts.join(" · "), payableTotal);
      onClose();
    } catch (err) {
      console.error("Close order error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions: {
    id: PaymentMethod;
    label: string;
    description: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
  }[] = [
      {
        id: "Cash",
        label: "Cash",
        description: "Received full payment in cash",
        icon: Banknote,
        color: "text-emerald-700",
        bgColor: "bg-emerald-50 hover:bg-emerald-100/70",
        borderColor: "border-emerald-500",
      },
      {
        id: "GPay",
        label: "GPay / UPI",
        description: "Paid via GPay, PhonePe, or QR Code",
        icon: Smartphone,
        color: "text-blue-700",
        bgColor: "bg-blue-50 hover:bg-blue-100/70",
        borderColor: "border-blue-500",
      },
      {
        id: "Online Orders",
        label: "Online Orders",
        description: "Zomato, Swiggy or Online platform",
        icon: Globe,
        color: "text-purple-700",
        bgColor: "bg-purple-50 hover:bg-purple-100/70",
        borderColor: "border-purple-500",
      },
      {
        id: "Split Payment",
        label: "Split Payment",
        description: "Half GPay / Cash or custom split",
        icon: Split,
        color: "text-indigo-700",
        bgColor: "bg-indigo-50 hover:bg-indigo-100/70",
        borderColor: "border-indigo-500",
      },
      {
        id: "Nil",
        label: "Nil (Item given - Payment pending)",
        description: "Order served but payment not received yet",
        icon: AlertCircle,
        color: "text-amber-800",
        bgColor: "bg-amber-50 hover:bg-amber-100/70",
        borderColor: "border-amber-500",
      },
    ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl transition-all sm:p-6 my-auto max-h-[90vh] flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
              Select Payment Method
            </h3>
            <p className="text-xs font-medium text-gray-500 sm:text-sm">
              Closing Order <span className="font-semibold text-black">{order.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Order Amount Banner */}
        <div className="my-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-3 text-white sm:my-4 sm:p-4 shadow-md">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] font-medium text-gray-300 uppercase tracking-wider sm:text-xs">
              Total Order Amount
            </p>
            <p className="truncate text-xs text-gray-200 font-normal">
              {order.lines.map((l) => `${l.name} ×${l.qty}`).join(", ")}
            </p>
            {isTakeaway && (
              <p className="mt-0.5 text-[10px] font-medium text-amber-200 sm:text-xs">
                Includes ₹10 takeaway charge
              </p>
            )}
          </div>
          <span className="text-xl font-extrabold text-white sm:text-2xl shrink-0">
            ₹{payableTotal}
          </span>
        </div>

        <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 sm:mb-4 sm:px-4">
          <span className="min-w-0">
            <span className="block text-xs font-bold text-gray-900 sm:text-sm">Takeaway order</span>
            <span className="block text-[11px] text-gray-600 sm:text-xs">Add ₹10 takeaway charge</span>
          </span>
          <input
            type="checkbox"
            checked={isTakeaway}
            onChange={(event) => handleTakeawayChange(event.target.checked)}
            className="h-5 w-5 shrink-0 accent-[#1177E5]"
          />
        </label>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 sm:space-y-3 max-h-[50vh]">
          {paymentOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedMethod === opt.id;
            return (
              <div key={opt.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedMethod(opt.id)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition-all ${
                    opt.bgColor
                  } ${
                    isSelected
                      ? opt.borderColor
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-white shadow-sm" : "bg-white/80"
                        }`}
                    >
                      <Icon className={`h-5 w-5 ${opt.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 sm:text-sm truncate">
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-gray-600 truncate sm:text-xs">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 pl-1">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${isSelected
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white"
                        }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>

                {/* Sub-inputs for Split Payment */}
                {opt.id === "Split Payment" && isSelected && (
                  <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-900">
                        Specify Split Amounts:
                      </span>
                      <button
                        type="button"
                        onClick={setHalfSplit}
                        className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                      >
                        50 / 50 Half Split
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                          Cash Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={payableTotal}
                          value={cashAmount || ""}
                          onChange={(e) => handleCashChange(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                          GPay Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={payableTotal}
                          value={gpayAmount || ""}
                          onChange={(e) => handleGpayChange(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-gray-600 font-medium">
                        Combined Total: ₹{cashAmount + gpayAmount} / ₹{payableTotal}
                      </span>
                      {cashAmount + gpayAmount !== payableTotal ? (
                        <span className="font-bold text-rose-600">
                          Must equal ₹{payableTotal}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Balanced
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Warning note for Nil */}
                {opt.id === "Nil" && isSelected && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-amber-900 animate-in fade-in duration-150">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-snug">
                      This order will be moved to Past Orders marked as <strong className="font-semibold text-amber-950">Nil / Unpaid</strong>. You can view it under Past Orders.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex items-center justify-end gap-2.5 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isSplitValid || isSubmitting}
            onClick={handleConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-[#1177E5] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all sm:text-sm"
          >
            {isSubmitting ? "Closing..." : `Confirm & Close (${selectedMethod})`}
          </button>
        </div>
      </div>
    </div>
  );
}
