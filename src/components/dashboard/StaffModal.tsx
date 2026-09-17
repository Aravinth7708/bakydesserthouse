import { useState, useEffect } from "react";
import { StaffMember, useStore } from "@/lib/store";
import { X, User, Phone, Lock, Eye, EyeOff } from "lucide-react";

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember?: StaffMember | null;
}

export function StaffModal({ isOpen, onClose, staffMember }: StaffModalProps) {
  const { addStaff, updateStaff } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (staffMember) {
      setName(staffMember.name);
      setPhone(staffMember.phone);
      setPassword(staffMember.password);
    } else {
      setName("");
      setPhone("");
      setPassword("");
    }
  }, [staffMember, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (staffMember) {
        await updateStaff(staffMember.id, { name, phone, password });
      } else {
        await addStaff({ name, phone, password });
      }
      onClose();
    } catch (err) {
      console.error("Staff save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 border border-gray-200 sm:p-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#1177E5]" />
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
              {staffMember ? "Edit Staff Member" : "Add New Staff Member"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-gray-500">
            Staff members will use their <strong>Phone Number</strong> and <strong>Password</strong> to access the POS & Orders sections.
          </p>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Staff Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5]"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Staff Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Access Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Set password for POS & Orders login"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-9 py-2 text-sm font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Note */}
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3 text-[11px] text-blue-900 leading-snug">
            💡 <strong>Permissions:</strong> Staff can only access the <strong>POS</strong> and <strong>Orders</strong> pages. Dashboard, Menu, Inventory, and Staff Admin settings are restricted to Admin.
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#1177E5] px-5 py-2 text-xs font-bold text-white hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : staffMember ? "Save Changes" : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
