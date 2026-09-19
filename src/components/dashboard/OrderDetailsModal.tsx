import { Order, OrderStatus } from "@/lib/store";
import { X, Info, ShoppingBag, CreditCard, Banknote, Smartphone, Globe, Split, AlertCircle, CheckCircle2, Clock, ChefHat, Check } from "lucide-react";

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Served":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Served
          </span>
        );
      case "Preparing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
            <ChefHat className="h-3.5 w-3.5" /> Preparing
          </span>
        );
      case "New":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
            <Clock className="h-3.5 w-3.5" /> New Order
          </span>
        );
      case "Past Orders":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-800 border border-gray-300">
            <Check className="h-3.5 w-3.5" /> Closed / Past
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentBadge = () => {
    if (!order.paymentMethod) return null;

    switch (order.paymentMethod) {
      case "Cash":
        return (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900">
            <Banknote className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Paid via Cash</p>
              <p className="text-[11px] text-emerald-700">Full payment received in cash</p>
            </div>
          </div>
        );
      case "GPay":
        return (
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 p-3 text-blue-900">
            <Smartphone className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Paid via GPay / UPI</p>
              <p className="text-[11px] text-blue-700">Digital UPI payment completed</p>
            </div>
          </div>
        );
      case "Online Orders":
        return (
          <div className="flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200 p-3 text-purple-900">
            <Globe className="h-5 w-5 text-purple-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Online Platform Order</p>
              <p className="text-[11px] text-purple-700">Processed via online aggregator</p>
            </div>
          </div>
        );
      case "Split Payment":
        return (
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-indigo-900">
            <Split className="h-5 w-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Split Payment</p>
              <p className="text-[11px] text-indigo-700">{order.paymentDetails || "Cash + GPay"}</p>
            </div>
          </div>
        );
      case "Nil":
        return (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Nil / Unpaid Order</p>
              <p className="text-[11px] text-amber-700">{order.paymentDetails || "Item delivered without payment"}</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 p-3 text-gray-800">
            <CreditCard className="h-5 w-5 text-gray-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Payment Method: {order.paymentMethod}</p>
              {order.paymentDetails && <p className="text-[11px] text-gray-600">{order.paymentDetails}</p>}
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl transition-all sm:p-6 my-auto max-h-[90vh] flex flex-col min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1177E5]/10 text-[#1177E5]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-gray-900 sm:text-xl">
                  Order {order.id}
                </h3>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-xs font-medium text-gray-500">
                Detailed Order Breakdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Payment Method Banner (if closed / payment recorded) */}
        {order.paymentMethod && (
          <div className="mt-3">
            {getPaymentBadge()}
          </div>
        )}

        {/* Items List */}
        <div className="my-3 flex-1 overflow-y-auto pr-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Items Ordered ({order.lines.reduce((s, l) => s + l.qty, 0)})
          </p>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50">
            {order.lines.map((line, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 text-xs sm:text-sm">
                <div className="min-w-0 pr-3">
                  <p className="font-bold text-gray-900 truncate">{line.name}</p>
                  {line.variant && (
                    <span className="inline-block rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100 mt-0.5">
                      Variant: {line.variant}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <span className="text-xs text-gray-500 font-medium">
                    {line.qty} × ₹{line.price}
                  </span>
                  <span className="font-extrabold text-gray-900 min-w-[50px]">
                    ₹{line.qty * line.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grand Total Footer */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between rounded-xl bg-gray-900 p-3 text-white sm:p-4 shadow-md">
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Grand Total
              </p>
              <p className="text-xs text-gray-300 font-normal">
                Includes all taxes & items
              </p>
            </div>
            <span className="text-2xl font-black text-white">
              ₹{order.total}
            </span>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl bg-gray-100 px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
