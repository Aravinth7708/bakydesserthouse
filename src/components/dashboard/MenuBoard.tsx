import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useStore, type Category, type MenuItem } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={on}
      title={on ? "Click to disable (hide from POS)" : "Click to enable (show in POS)"}
      className={`relative h-[21px] w-[43px] shrink-0 rounded-full transition-colors ${
        on ? "bg-baky-green" : "bg-baky-track"
      }`}
    >
      <span
        className={`absolute top-1/2 h-[17px] w-[17px] -translate-y-1/2 rounded-full bg-white transition-all ${
          on ? "left-[24px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

export function MenuBoard() {
  const {
    categories,
    items,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
  } = useStore();

  const [activeCat, setActiveCat] = useState<string>("");
  const [filterByCat, setFilterByCat] = useState<boolean>(true);

  // Category Dialog State
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catDialogMode, setCatDialogMode] = useState<"add" | "edit">("add");
  const [catEditId, setCatEditId] = useState<string>("");
  const [catNameInput, setCatNameInput] = useState<string>("");

  // Item Dialog State
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemDialogMode, setItemDialogMode] = useState<"add" | "edit">("add");
  const [itemEditId, setItemEditId] = useState<string>("");
  const [itemNameInput, setItemNameInput] = useState<string>("");
  const [itemPriceInput, setItemPriceInput] = useState<string>("100");
  const [itemCatInput, setItemCatInput] = useState<string>("");
  const [itemVariantsInput, setItemVariantsInput] = useState<string>("");
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "item";
    id: string;
    name: string;
  } | null>(null);

  // Keep active category valid
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === activeCat)) {
      setActiveCat(categories[0].id);
    }
  }, [categories, activeCat]);

  // Selected category object
  const selectedCat = categories.find((c) => c.id === activeCat);

  // Filter items based on selection
  const displayedItems = filterByCat && activeCat
    ? items.filter((i) => i.categoryId === activeCat)
    : items;

  // --- Category Handlers ---
  const handleOpenAddCategory = () => {
    setCatDialogMode("add");
    setCatEditId("");
    setCatNameInput("");
    setCatDialogOpen(true);
  };

  const handleOpenEditCategory = (c: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setCatDialogMode("edit");
    setCatEditId(c.id);
    setCatNameInput(c.name);
    setCatDialogOpen(true);
  };

  const handleDeleteCategory = (c: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({
      type: "category",
      id: c.id,
      name: c.name,
    });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = catNameInput.trim();
    if (!trimmed) return;
    if (catDialogMode === "add") {
      addCategory(trimmed);
    } else {
      updateCategory(catEditId, trimmed);
    }
    setCatDialogOpen(false);
  };

  // --- Item Handlers ---
  const handleOpenAddItem = () => {
    setItemDialogMode("add");
    setItemEditId("");
    setItemNameInput("");
    setItemPriceInput("100");
    setItemCatInput(activeCat || categories[0]?.id || "");
    setItemVariantsInput("");
    setItemDialogOpen(true);
  };

  const handleOpenEditItem = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemDialogMode("edit");
    setItemEditId(item.id);
    setItemNameInput(item.name);
    setItemPriceInput(String(item.price));
    setItemCatInput(item.categoryId);
    setItemVariantsInput(item.variants.join(", "));
    setItemDialogOpen(true);
  };

  const handleDeleteItem = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({
      type: "item",
      id: item.id,
      name: item.name,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "category") {
      deleteCategory(deleteConfirm.id);
    } else {
      deleteItem(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = itemNameInput.trim();
    const price = Number(itemPriceInput);
    if (!name || Number.isNaN(price) || price < 0) return;
    const categoryId = itemCatInput || activeCat || categories[0]?.id || "c1";
    const variants = itemVariantsInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    if (itemDialogMode === "add") {
      addItem({ name, price, categoryId, variants });
    } else {
      updateItem(itemEditId, { name, price, categoryId, variants });
    }
    setItemDialogOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col rounded-[15px] bg-baky-surface shadow-sm">
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        {/* Category Column */}
        <section className="flex flex-col border-b border-baky-muted/50 p-3 md:border-b-0 md:border-r md:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">
                Category ({categories.length})
              </h2>
              <p className="text-xs text-baky-muted md:text-sm">
                Click a category to filter items
              </p>
            </div>
            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-1 text-xs font-semibold text-[#1177E5] transition-opacity hover:opacity-80 md:text-sm lg:text-lg"
            >
              <Plus className="h-4 w-4" />
              <span>ADD NEW</span>
            </button>
          </div>

          <ul className="mt-3 divide-y divide-baky-muted/30 md:mt-4 lg:mt-6">
            {categories.map((c) => {
              const isSelected = activeCat === c.id;
              return (
                <li
                  key={c.id}
                  onClick={() => {
                    setActiveCat(c.id);
                    setFilterByCat(true);
                  }}
                  className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-3 text-sm text-black transition-colors md:py-3.5 md:text-base lg:py-4 lg:text-xl ${
                    isSelected
                      ? "bg-baky-card font-medium"
                      : "hover:bg-baky-card/50"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        c.enabled ? "bg-baky-green" : "bg-baky-muted"
                      }`}
                    />
                    <span className="truncate">{c.name}</span>
                    {!c.enabled && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                        Hidden in POS
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => handleOpenEditCategory(c, e)}
                        title="Edit category"
                        className="rounded p-1 text-baky-muted transition-colors hover:bg-gray-200 hover:text-black"
                      >
                        <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCategory(c, e)}
                        title="Delete category"
                        className="rounded p-1 text-baky-muted transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </button>
                    </div>

                    <Toggle
                      on={c.enabled}
                      onToggle={() => toggleCategory(c.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Items Column */}
        <section className="flex flex-col p-3 md:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">
                  Items ({displayedItems.length})
                </h2>
                {selectedCat && filterByCat && (
                  <span className="rounded-full bg-[#1177E5]/10 px-2 py-0.5 text-xs font-medium text-[#1177E5]">
                    {selectedCat.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => setFilterByCat(!filterByCat)}
                className="mt-0.5 text-xs text-[#1177E5] underline hover:opacity-80"
              >
                {filterByCat ? "Show All Categories" : "Filter by Selected Category"}
              </button>
            </div>
            <button
              onClick={handleOpenAddItem}
              className="flex items-center gap-1 text-xs font-semibold text-[#1177E5] transition-opacity hover:opacity-80 md:text-sm lg:text-lg"
            >
              <Plus className="h-4 w-4" />
              <span>ADD NEW</span>
            </button>
          </div>

          <ul className="mt-3 space-y-3 md:mt-4 md:space-y-4 lg:mt-6 lg:space-y-5">
            {displayedItems.length === 0 ? (
              <li className="py-8 text-center text-sm text-baky-muted md:text-base">
                No items found for this category. Click &quot;+ ADD NEW&quot; to add one!
              </li>
            ) : (
              displayedItems.map((item) => (
                <li
                  key={item.id}
                  className="group flex items-start justify-between gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-baky-muted/30 hover:bg-white/60 lg:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-baky-bar-strong md:h-[8px] md:w-[8px] lg:h-[9px] lg:w-[9px]" />
                      <p className="text-sm text-black md:text-base lg:text-xl">
                        {item.name},{" "}
                        <span className="font-semibold text-black">₹{item.price}</span>
                      </p>
                      {!item.enabled && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          Disabled in POS
                        </span>
                      )}
                    </div>
                    {item.variants.length > 0 && (
                      <p className="mt-0.5 pl-4 text-xs font-semibold text-[#1177E5] md:text-sm lg:mt-1 lg:text-[15px]">
                        + {item.variants.length} Variants (
                        {item.variants.join(", ")})
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    {/* Item Action Buttons */}
                    <div className="flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => handleOpenEditItem(item, e)}
                        title="Edit item"
                        className="rounded p-1 text-baky-muted transition-colors hover:bg-gray-200 hover:text-black"
                      >
                        <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(item, e)}
                        title="Delete item"
                        className="rounded p-1 text-baky-muted transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </button>
                    </div>

                    <Toggle
                      on={item.enabled}
                      onToggle={() => toggleItem(item.id)}
                    />
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* Category Dialog (Add/Edit) */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {catDialogMode === "add" ? "Add New Category" : "Edit Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
            <div>
              <label
                htmlFor="cat-name"
                className="block text-xs font-medium text-baky-muted"
              >
                Category Name
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={catNameInput}
                onChange={(e) => setCatNameInput(e.target.value)}
                placeholder="e.g. Crepes, Pancakes..."
                className="mt-1 w-full rounded-md border border-baky-muted/60 bg-white px-3 py-2 text-sm text-black focus:border-[#1177E5] focus:outline-none"
              />
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setCatDialogOpen(false)}
                className="rounded-md border border-baky-muted/60 px-4 py-2 text-sm font-medium text-black hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#3395FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2a86ea]"
              >
                {catDialogMode === "add" ? "Create Category" : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Dialog (Add/Edit) */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {itemDialogMode === "add" ? "Add Menu Item" : "Edit Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-3 pt-2">
            <div>
              <label
                htmlFor="item-name"
                className="block text-xs font-medium text-baky-muted"
              >
                Item Name
              </label>
              <input
                id="item-name"
                type="text"
                required
                value={itemNameInput}
                onChange={(e) => setItemNameInput(e.target.value)}
                placeholder="e.g. Nutella Waffle"
                className="mt-1 w-full rounded-md border border-baky-muted/60 bg-white px-3 py-2 text-sm text-black focus:border-[#1177E5] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="item-price"
                  className="block text-xs font-medium text-baky-muted"
                >
                  Price (₹)
                </label>
                <input
                  id="item-price"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={itemPriceInput}
                  onChange={(e) => setItemPriceInput(e.target.value)}
                  className="mt-1 w-full rounded-md border border-baky-muted/60 bg-white px-3 py-2 text-sm text-black focus:border-[#1177E5] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="item-cat"
                  className="block text-xs font-medium text-baky-muted"
                >
                  Category
                </label>
                <select
                  id="item-cat"
                  value={itemCatInput}
                  onChange={(e) => setItemCatInput(e.target.value)}
                  className="mt-1 w-full rounded-md border border-baky-muted/60 bg-white px-3 py-2 text-sm text-black focus:border-[#1177E5] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="item-variants"
                className="block text-xs font-medium text-baky-muted"
              >
                Variants (Comma-separated)
              </label>
              <input
                id="item-variants"
                type="text"
                value={itemVariantsInput}
                onChange={(e) => setItemVariantsInput(e.target.value)}
                placeholder="e.g. Belgian, Brownie, Redvelvet"
                className="mt-1 w-full rounded-md border border-baky-muted/60 bg-white px-3 py-2 text-sm text-black focus:border-[#1177E5] focus:outline-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setItemDialogOpen(false)}
                className="rounded-md border border-baky-muted/60 px-4 py-2 text-sm font-medium text-black hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#3395FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2a86ea]"
              >
                {itemDialogMode === "add" ? "Add Item" : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              {deleteConfirm?.type === "category"
                ? "Delete Category?"
                : "Delete Item?"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-black">
            Are you sure you want to delete &ldquo;{deleteConfirm?.name}&rdquo;?
            {deleteConfirm?.type === "category" && (
              <span className="mt-1 block text-xs text-red-500">
                Warning: All items in this category will also be deleted from POS and Database.
              </span>
            )}
          </div>
          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="rounded-md border border-baky-muted/60 px-4 py-2 text-sm font-medium text-black hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
