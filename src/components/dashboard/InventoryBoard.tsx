import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useStore, type InventoryItem } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function InventoryBoard() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [currentInput, setCurrentInput] = useState<string>("0");
  const [maxInput, setMaxInput] = useState<string>("10");

  const handleOpenAdd = () => {
    setDialogMode("add");
    setEditId("");
    setNameInput("");
    setCurrentInput("0");
    setMaxInput("10");
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setDialogMode("edit");
    setEditId(item.id);
    setNameInput(item.name);
    setCurrentInput(String(item.current));
    setMaxInput(String(item.max));
    setDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    const current = Number(currentInput);
    const max = Number(maxInput);
    if (!name || Number.isNaN(current) || Number.isNaN(max) || max <= 0) return;

    if (dialogMode === "add") {
      addInventoryItem({ name, current, max });
    } else {
      updateInventoryItem(editId, { name, current, max });
    }
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col rounded-[15px] bg-baky-surface p-3 md:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">
          Item ({inventory.length})
        </h2>
        <button
          onClick={handleOpenAdd}
          className="text-xs font-semibold text-[#1177E5] md:text-sm lg:text-lg"
        >
          + ADD NEW
        </button>
      </div>

      <ul className="mt-3 divide-y divide-baky-muted/30 md:mt-4 lg:mt-6">
        {inventory.map((item) => {
          const low = item.current <= item.max * 0.3;
          return (
            <li
              key={item.id}
              className={`flex items-center justify-between gap-3 px-2 py-3 md:gap-4 md:py-3.5 lg:py-4 ${
                low ? "bg-baky-card" : ""
              }`}
            >
              <span
                className={`min-w-0 truncate text-sm md:text-base lg:text-xl ${
                  low ? "text-black" : "text-baky-muted"
                }`}
              >
                {item.name}
              </span>
              <div className="flex shrink-0 items-center gap-2 md:gap-3 lg:gap-3">
                <span
                  className={`text-xs font-semibold md:text-sm lg:text-lg ${
                    low ? "text-[#1177E5]" : "text-baky-muted"
                  }`}
                >
                  {item.current} / {item.max}
                </span>
                <button
                  aria-label="Edit item"
                  onClick={() => handleOpenEdit(item)}
                >
                  <Pencil
                    className="h-4 w-4 md:h-5 md:w-5"
                    style={{ color: low ? "#FF8205" : "#686868" }}
                    strokeWidth={2}
                  />
                </button>
                <button
                  aria-label="Delete item"
                  onClick={() => deleteInventoryItem(item.id)}
                  className="text-baky-muted hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add Inventory Item" : "Edit Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-baky-muted">
                Item Name
              </label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Nutella, Belgian Chocolate..."
                className="mt-1 w-full rounded-md border border-baky-muted/60 bg-white px-3 py-2 text-sm text-black focus:border-[#1177E5] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-baky-muted">
                  Current Stock
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  className="mt-1 w-full rounded-md border border-baky-muted/60 bg-white px-3 py-2 text-sm text-black focus:border-[#1177E5] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-baky-muted">
                  Max Stock
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  className="mt-1 w-full rounded-md border border-baky-muted/60 bg-white px-3 py-2 text-sm text-black focus:border-[#1177E5] focus:outline-none"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-md border border-baky-muted/60 px-4 py-2 text-sm font-medium text-black hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#3395FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2a86ea]"
              >
                {dialogMode === "add" ? "Add Item" : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
