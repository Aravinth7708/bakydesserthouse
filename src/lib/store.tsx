import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type Category = { id: string; name: string; enabled: boolean };

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  variants: string[];
  enabled: boolean;
};

export type InventoryItem = {
  id: string;
  name: string;
  current: number;
  max: number;
};

export type OrderStatus = "New" | "Preparing" | "Served" | "Past Orders";

export type PaymentMethod =
  | "Cash"
  | "GPay"
  | "Online Orders"
  | "Split Payment"
  | "Nil";

export type OrderLine = {
  name: string;
  price: number;
  qty: number;
  variant?: string;
};

export type Order = {
  id: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod | string;
  paymentDetails?: string;
  createdAt?: string;
};

export type StaffMember = {
  id: string;
  name: string;
  phone: string;
  password: string;
  createdAt?: string;
};

export type UserRole = "Admin" | "Staff";

export type ExpenseCategory =
  | "Fuel"
  | "Stock / Ingredients"
  | "Water & Utilities"
  | "Maintenance & Repair"
  | "Salary"
  | "Other";

export type Expense = {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  date: string;
  createdAt?: string;
};

export type CurrentUser = {
  role: UserRole;
  staffMember?: StaffMember;
  isAuthenticated: boolean;
};

export type DateRangeFilter = "Today" | "Last 7 Days" | "Last 30 Days" | "All Time";

export type OutletInfo = {
  name: string;
  location: string;
  hours: string;
  phone: string;
  status: "Active" | "Closed";
};

type Store = {
  categories: Category[];
  items: MenuItem[];
  inventory: InventoryItem[];
  orders: Order[];
  expenses: Expense[];
  staff: StaffMember[];
  currentUser: CurrentUser | null;
  isSynced: boolean;
  dateRange: DateRangeFilter;
  setDateRange: (range: DateRangeFilter) => void;
  outletInfo: OutletInfo;
  updateOutletInfo: (info: OutletInfo) => void;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategory: (id: string) => Promise<void>;
  addItem: (input: {
    name: string;
    price: number;
    categoryId: string;
    variants: string[];
  }) => Promise<void>;
  updateItem: (
    id: string,
    input: {
      name: string;
      price: number;
      categoryId: string;
      variants: string[];
    },
  ) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  addInventoryItem: (input: { name: string; current: number; max: number }) => Promise<void>;
  updateInventoryItem: (
    id: string,
    input: { name: string; current: number; max: number },
  ) => Promise<void>;
  updateStock: (id: string, current: number, max: number) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  placeOrder: (lines: OrderLine[]) => Promise<void>;
  advanceOrder: (id: string) => Promise<void>;
  closeOrder: (
    id: string,
    paymentMethod: PaymentMethod | string,
    paymentDetails?: string,
    total?: number,
  ) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  clearAllOrders: () => Promise<void>;
  addStaff: (input: { name: string; phone: string; password: string }) => Promise<void>;
  updateStaff: (
    id: string,
    input: { name: string; phone: string; password: string },
  ) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addExpense: (input: {
    title: string;
    category: ExpenseCategory;
    amount: number;
    paymentMethod?: string;
    notes?: string;
    date?: string;
  }) => Promise<void>;
  updateExpense: (
    id: string,
    input: {
      title: string;
      category: ExpenseCategory;
      amount: number;
      paymentMethod?: string;
      notes?: string;
      date?: string;
    },
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  clearAllExpenses: () => Promise<void>;
  resetShopData: (options?: {
    clearOrders?: boolean;
    clearExpenses?: boolean;
    resetMenu?: boolean;
    resetInventory?: boolean;
  }) => Promise<void>;
  loginAsStaff: (phone: string, pass: string) => Promise<boolean>;
  loginAsAdmin: (pass: string) => boolean;
  switchToAdmin: (pass: string) => boolean;
  logout: () => void;
};

const StoreContext = createContext<Store | null>(null);

export const initialCategories: Category[] = [
  { id: "c1", name: "Waffle", enabled: true },
  { id: "c2", name: "Shakes", enabled: true },
  { id: "c3", name: "Signature", enabled: true },
  { id: "c4", name: "Brownie", enabled: true },
];

export const initialItems: MenuItem[] = [
  // Waffle Category (c1)
  {
    id: "i1",
    name: "Butterscotch Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },
  {
    id: "i2",
    name: "Classic Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },
  {
    id: "i3",
    name: "Cookie & Cream Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },
  {
    id: "i4",
    name: "Dark Choco Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },
  {
    id: "i5",
    name: "Dark White Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },
  {
    id: "i6",
    name: "Death By Choco Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },
  {
    id: "i7",
    name: "Hazelnut Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },
  {
    id: "i8",
    name: "Milk Choco Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },
  {
    id: "i9",
    name: "Triple Chocolate Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },
  {
    id: "i10",
    name: "Red Velvet Waffle",
    price: 100,
    categoryId: "c1",
    variants: ["Belgian", "Brownie", "Redvelvet"],
    enabled: true,
  },

  // Shakes Category (c2)
  {
    id: "i11",
    name: "Choco Shake",
    price: 120,
    categoryId: "c2",
    variants: [],
    enabled: true,
  },
  {
    id: "i12",
    name: "Black Currant",
    price: 80,
    categoryId: "c2",
    variants: [],
    enabled: true,
  },
  {
    id: "i13",
    name: "Blue Berry",
    price: 80,
    categoryId: "c2",
    variants: [],
    enabled: true,
  },
  {
    id: "i14",
    name: "Chocolate",
    price: 80,
    categoryId: "c2",
    variants: [],
    enabled: true,
  },

  // Signature Category (c3)
  {
    id: "i15",
    name: "Baky Special Waffle",
    price: 150,
    categoryId: "c3",
    variants: [],
    enabled: true,
  },
  {
    id: "i16",
    name: "Loaded Brownie Sundae",
    price: 160,
    categoryId: "c3",
    variants: [],
    enabled: true,
  },

  // Brownie Category (c4)
  {
    id: "i17",
    name: "Classic Brownie",
    price: 90,
    categoryId: "c4",
    variants: [],
    enabled: true,
  },
  {
    id: "i18",
    name: "Sizzling Brownie",
    price: 140,
    categoryId: "c4",
    variants: [],
    enabled: true,
  },
];

export const initialInventory: InventoryItem[] = [
  { id: "n1", name: "Waffle Flour (kg)", current: 2, max: 10 },
  { id: "n2", name: "Brownie Plates (Pack)", current: 7, max: 10 },
  { id: "n3", name: "Dark Compound (Pack)", current: 1, max: 10 },
];

const initialOrders: Order[] = [
  {
    id: "#0001",
    lines: [
      { name: "Death By Choco Waffle", price: 100, qty: 2, variant: "Belgian" },
      { name: "Choco Shake", price: 120, qty: 1 },
    ],
    total: 320,
    status: "Served",
    paymentMethod: "GPay",
    createdAt: new Date().toISOString(),
  },
  {
    id: "#0002",
    lines: [
      { name: "Baky Special Waffle", price: 150, qty: 1 },
      { name: "Sizzling Brownie", price: 140, qty: 1 },
    ],
    total: 290,
    status: "Preparing",
    paymentMethod: "Cash",
    createdAt: new Date().toISOString(),
  },
];

const initialExpenses: Expense[] = [
  {
    id: "e1",
    title: "Fuel for delivery vehicle",
    category: "Fuel",
    amount: 500,
    paymentMethod: "Cash",
    date: new Date().toISOString().split("T")[0],
    notes: "Petrol refill for delivery scooter",
  },
  {
    id: "e2",
    title: "Chocolate blocks & Cocoa powder stock",
    category: "Stock / Ingredients",
    amount: 2500,
    paymentMethod: "GPay",
    date: new Date().toISOString().split("T")[0],
    notes: "5kg dark chocolate slabs & cocoa powder",
  },
  {
    id: "e3",
    title: "20L Drinking Water Cans (10 Units)",
    category: "Water & Utilities",
    amount: 350,
    paymentMethod: "Cash",
    date: new Date().toISOString().split("T")[0],
    notes: "Purified drinking water for shop",
  },
];

const initialOutletInfo: OutletInfo = {
  name: "Baky Dessert House (Main Outlet)",
  location: "Main Store Counter",
  hours: "10:00 AM – 11:00 PM",
  phone: "+91 98765 43210",
  status: "Active",
};

const LOCAL_CAT_KEY = "baky_categories_v1";
const LOCAL_ITEM_KEY = "baky_items_v1";
const LOCAL_INV_KEY = "baky_inventory_v1";
const LOCAL_ORDER_KEY = "baky_orders_v1";
const LOCAL_EXPENSE_KEY = "baky_expenses_v1";
const LOCAL_STAFF_KEY = "baky_staff_v1";
const LOCAL_USER_KEY = "baky_user_v1";
const LOCAL_OUTLET_KEY = "baky_outlet_v1";
const SHOP_RESTORE_KEY = "baky_shop_restored_v4";

const initialStaff: StaffMember[] = [
  {
    id: "s1",
    name: "Staff 1",
    phone: "9876543210",
    password: "1234",
  },
];

function isNetworkError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || error.details || error || "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("fetcherror") ||
    msg.includes("networkerror") ||
    msg.includes("enotfound") ||
    msg.includes("load failed") ||
    msg.includes("network request failed")
  );
}

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to write to localStorage:", e);
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [orderNo, setOrderNo] = useState(3);
  const [isSynced, setIsSynced] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>("Last 7 Days");
  const [outletInfo, setOutletInfo] = useState<OutletInfo>(initialOutletInfo);

  const generateId = (prefix: string) => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  };

  // Restore state from localStorage
  useEffect(() => {
    const savedCat = getLocal(LOCAL_CAT_KEY, initialCategories);
    const validCats = Array.isArray(savedCat) && savedCat.length > 0 ? savedCat : initialCategories;

    const savedItem = getLocal(LOCAL_ITEM_KEY, initialItems);
    const validItems = Array.isArray(savedItem) && savedItem.length > 0 ? savedItem : initialItems;

    let savedInv = getLocal(LOCAL_INV_KEY, initialInventory);
    let savedOrders = getLocal(LOCAL_ORDER_KEY, initialOrders);
    let savedExpenses = getLocal(LOCAL_EXPENSE_KEY, initialExpenses);

    // If previous v3 cleanup zeroed out localStorage, restore initial working data once
    if (typeof window !== "undefined" && !localStorage.getItem(SHOP_RESTORE_KEY)) {
      localStorage.setItem(SHOP_RESTORE_KEY, "true");
      if (!Array.isArray(savedOrders) || savedOrders.length === 0) {
        savedOrders = initialOrders;
        setLocal(LOCAL_ORDER_KEY, initialOrders);
      }
      if (!Array.isArray(savedExpenses) || savedExpenses.length === 0) {
        savedExpenses = initialExpenses;
        setLocal(LOCAL_EXPENSE_KEY, initialExpenses);
      }
      savedInv = initialInventory;
      setLocal(LOCAL_INV_KEY, initialInventory);
    }

    setCategories(validCats);
    setItems(validItems);
    setInventory(Array.isArray(savedInv) && savedInv.length > 0 ? savedInv : initialInventory);
    setOrders(Array.isArray(savedOrders) ? savedOrders : initialOrders);
    setExpenses(Array.isArray(savedExpenses) ? savedExpenses : initialExpenses);

    if (Array.isArray(savedOrders) && savedOrders.length > 0) {
      const maxNum = savedOrders.reduce((max: number, o: any) => {
        const num = parseInt(String(o.id).replace(/\D/g, ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      setOrderNo(maxNum + 1);
    }

    const savedStaff = getLocal(LOCAL_STAFF_KEY, initialStaff);
    const savedUser = getLocal<any>(LOCAL_USER_KEY, null);
    const savedOutlet = getLocal<OutletInfo>(LOCAL_OUTLET_KEY, initialOutletInfo);

    setStaff(Array.isArray(savedStaff) && savedStaff.length > 0 ? savedStaff : initialStaff);
    setOutletInfo(savedOutlet || initialOutletInfo);

    if (
      savedUser &&
      typeof savedUser === "object" &&
      (savedUser.role === "Admin" || savedUser.role === "Staff") &&
      savedUser.isAuthenticated
    ) {
      setCurrentUser(savedUser as CurrentUser);
    }
  }, []);

  // Fetch initial data from Supabase (when online)
  useEffect(() => {
    let mounted = true;
    let supabaseReachable = true;

    async function loadData() {
      if (!supabase || !isSupabaseConfigured || !supabaseReachable) {
        if (mounted) setIsSynced(true);
        return;
      }

      try {
        // Probe categories first to detect if Supabase host is reachable
        const probe = await supabase
          .from("categories")
          .select("*")
          .order("created_at", { ascending: true });

        if (probe.error && isNetworkError(probe.error)) {
          supabaseReachable = false;
          if (mounted) setIsSynced(true);
          return;
        }

        const results = await Promise.allSettled([
          Promise.resolve(probe),
          supabase.from("menu_items").select("*").order("created_at", { ascending: true }),
          supabase.from("inventory").select("*").order("created_at", { ascending: true }),
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
          supabase.from("staff").select("*").order("created_at", { ascending: true }),
          supabase.from("expenses").select("*").order("date", { ascending: false }),
        ]);

        if (!mounted) return;

        const catRes = results[0].status === "fulfilled" ? results[0].value : null;
        const itemRes = results[1].status === "fulfilled" ? results[1].value : null;
        const invRes = results[2].status === "fulfilled" ? results[2].value : null;
        const orderRes = results[3].status === "fulfilled" ? results[3].value : null;
        const staffRes = results[4].status === "fulfilled" ? results[4].value : null;
        const expRes = results[5].status === "fulfilled" ? results[5].value : null;

        if (catRes?.data && catRes.data.length > 0) {
          const loadedCats: Category[] = catRes.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            enabled: c.enabled,
          }));
          setCategories(loadedCats);
          setLocal(LOCAL_CAT_KEY, loadedCats);
        }

        if (itemRes?.data && itemRes.data.length > 0) {
          const loadedItems: MenuItem[] = itemRes.data.map((i: any) => ({
            id: i.id,
            name: i.name,
            price: Number(i.price),
            categoryId: i.category_id,
            variants: i.variants || [],
            enabled: i.enabled,
          }));
          setItems(loadedItems);
          setLocal(LOCAL_ITEM_KEY, loadedItems);
        }

        if (invRes?.data && invRes.data.length > 0) {
          const loadedInv = invRes.data.map((n: any) => ({
            id: n.id,
            name: n.name,
            current: Number(n.current),
            max: Number(n.max),
          }));
          setInventory(loadedInv);
          setLocal(LOCAL_INV_KEY, loadedInv);
        }

        if (orderRes?.data) {
          const loadedOrders: Order[] = orderRes.data.map((o: any) => ({
            id: o.id,
            lines: o.lines || [],
            total: Number(o.total),
            status: o.status as OrderStatus,
            paymentMethod: o.payment_method || o.paymentMethod || undefined,
            paymentDetails: o.payment_details || o.paymentDetails || undefined,
            createdAt: o.created_at || new Date().toISOString(),
          }));

          setOrders((prevLocal) => {
            const loadedIds = new Set(loadedOrders.map((o) => o.id));
            const unsyncedLocal = prevLocal.filter((o) => !loadedIds.has(o.id));
            const combined = [...loadedOrders, ...unsyncedLocal];

            const maxNum = combined.reduce((max: number, o) => {
              const num = parseInt(o.id.replace(/\D/g, ""), 10);
              return isNaN(num) ? max : Math.max(max, num);
            }, 0);
            setOrderNo(maxNum + 1);

            setLocal(LOCAL_ORDER_KEY, combined);
            return combined;
          });
        }

        if (staffRes?.data && staffRes.data.length > 0) {
          const loadedStaff = staffRes.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            phone: s.phone,
            password: s.password,
            createdAt: s.created_at,
          }));
          setStaff(loadedStaff);
          setLocal(LOCAL_STAFF_KEY, loadedStaff);
        }

        if (expRes?.data) {
          const loadedExp = expRes.data.map((e: any) => ({
            id: e.id,
            title: e.title,
            category: (e.category as ExpenseCategory) || "Other",
            amount: Number(e.amount),
            paymentMethod: e.payment_method || "Cash",
            notes: e.notes || undefined,
            date: e.date,
            createdAt: e.created_at,
          }));
          setExpenses(loadedExp);
          setLocal(LOCAL_EXPENSE_KEY, loadedExp);
        }

        setIsSynced(true);
      } catch {
        supabaseReachable = false;
        if (mounted) setIsSynced(true);
      }
    }

    loadData();

    const handleSync = () => {
      if (supabaseReachable) loadData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleSync);
      window.addEventListener("online", () => {
        supabaseReachable = true;
        loadData();
      });
    }

    const pollInterval = setInterval(() => {
      if (supabaseReachable) loadData();
    }, 8000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleSync);
      }
    };
  }, []);

  const value = useMemo<Store>(
    () => ({
      categories,
      items,
      inventory,
      orders,
      expenses,
      staff,
      currentUser,
      isSynced,
      dateRange,
      setDateRange,
      outletInfo,
      updateOutletInfo: (info: OutletInfo) => {
        setOutletInfo(info);
        setLocal(LOCAL_OUTLET_KEY, info);
        toast.success("Outlet settings updated");
      },
      addCategory: async (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const newCat: Category = { id: generateId("cat"), name: trimmed, enabled: true };

        setCategories((prev) => {
          const next = [...prev, newCat];
          setLocal(LOCAL_CAT_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase.from("categories").insert({
            id: newCat.id,
            name: newCat.name,
            enabled: newCat.enabled,
          });
          if (error && !isNetworkError(error)) {
            console.error("Supabase insert category error:", error);
          }
        }

        toast.success(`Category "${trimmed}" added`);
      },
      updateCategory: async (id: string, name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        let targetName = "";
        setCategories((prev) => {
          const target = prev.find((c) => c.id === id || c.name === name);
          if (target) targetName = target.name;
          const next = prev.map((c) =>
            c.id === id || c.name === targetName ? { ...c, name: trimmed } : c,
          );
          setLocal(LOCAL_CAT_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase
            .from("categories")
            .update({ name: trimmed })
            .eq("id", id);
          if (error && !isNetworkError(error)) {
            console.error("Supabase update category error:", error);
          }
        }

        toast.success(`Category renamed to "${trimmed}"`);
      },
      deleteCategory: async (idOrName: string) => {
        let targetName = "";
        let targetId = idOrName;

        setCategories((prev) => {
          const target = prev.find((c) => c.id === idOrName || c.name === idOrName);
          if (target) {
            targetName = target.name;
            targetId = target.id;
          }
          const next = prev.filter(
            (c) =>
              c.id !== idOrName &&
              c.name !== idOrName &&
              (targetName ? c.name !== targetName : true),
          );
          setLocal(LOCAL_CAT_KEY, next);
          return next;
        });

        setItems((prev) => {
          const next = prev.filter((i) => i.categoryId !== idOrName && i.categoryId !== targetId);
          setLocal(LOCAL_ITEM_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase.from("categories").delete().eq("id", targetId).then(() => { }, () => { });
        }

        toast.success("Category deleted");
      },
      toggleCategory: async (id: string) => {
        let targetName = "";
        let nextEnabled = false;
        setCategories((prev) => {
          const target = prev.find((c) => c.id === id);
          if (!target) return prev;
          targetName = target.name;
          nextEnabled = !target.enabled;
          const next = prev.map((c) =>
            c.id === id || c.name === targetName ? { ...c, enabled: nextEnabled } : c,
          );
          setLocal(LOCAL_CAT_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase
            .from("categories")
            .update({ enabled: nextEnabled })
            .eq("id", id);
          if (error && !isNetworkError(error)) {
            console.error("Supabase toggle category error:", error);
          }
        }

        toast.success(
          nextEnabled ? "Category enabled in POS" : "Category hidden from POS",
        );
      },
      addItem: async (input) => {
        const newItem: MenuItem = {
          id: generateId("item"),
          enabled: true,
          name: input.name.trim(),
          price: input.price,
          categoryId: input.categoryId,
          variants: input.variants,
        };
        setItems((prev) => {
          const next = [...prev, newItem];
          setLocal(LOCAL_ITEM_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase.from("menu_items").insert({
            id: newItem.id,
            name: newItem.name,
            price: newItem.price,
            category_id: newItem.categoryId,
            variants: newItem.variants,
            enabled: newItem.enabled,
          });
          if (error && !isNetworkError(error)) {
            console.error("Supabase insert item error:", error);
          }
        }

        toast.success(`Item "${newItem.name}" added`);
      },
      updateItem: async (id, input) => {
        const trimmed = input.name.trim();
        let targetName = "";
        setItems((prev) => {
          const target = prev.find((i) => i.id === id || i.name === trimmed);
          if (target) targetName = target.name;
          const next = prev.map((i) =>
            i.id === id || (targetName && i.name === targetName)
              ? {
                ...i,
                name: trimmed,
                price: input.price,
                categoryId: input.categoryId,
                variants: input.variants,
              }
              : i,
          );
          setLocal(LOCAL_ITEM_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase
            .from("menu_items")
            .update({
              name: trimmed,
              price: input.price,
              category_id: input.categoryId,
              variants: input.variants,
            })
            .eq("id", id);
          if (error && !isNetworkError(error)) {
            console.error("Supabase update item error:", error);
          }
        }

        toast.success(`Item "${trimmed}" updated`);
      },
      deleteItem: async (idOrName: string) => {
        let targetName = "";
        let targetId = idOrName;

        setItems((prev) => {
          const target = prev.find((i) => i.id === idOrName || i.name === idOrName);
          if (target) {
            targetName = target.name;
            targetId = target.id;
          }
          const next = prev.filter(
            (i) =>
              i.id !== idOrName &&
              i.name !== idOrName &&
              (targetName ? i.name !== targetName : true),
          );
          setLocal(LOCAL_ITEM_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase.from("menu_items").delete().eq("id", targetId).then(() => { }, () => { });
        }

        toast.success("Item deleted");
      },
      toggleItem: async (id: string) => {
        const target = items.find((i) => i.id === id);
        if (!target) return;
        const nextEnabled = !target.enabled;
        setItems((prev) => {
          const next = prev.map((i) =>
            i.id === id || i.name === target.name ? { ...i, enabled: nextEnabled } : i,
          );
          setLocal(LOCAL_ITEM_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase
            .from("menu_items")
            .update({ enabled: nextEnabled })
            .eq("id", id);
          if (error && !isNetworkError(error)) {
            console.error("Supabase toggle item error:", error);
          }
        }

        toast.success(
          nextEnabled
            ? `"${target.name}" enabled in POS`
            : `"${target.name}" hidden from POS`,
        );
      },
      addInventoryItem: async (input) => {
        const newInv: InventoryItem = {
          id: generateId("inv"),
          name: input.name.trim(),
          current: Math.max(0, input.current),
          max: Math.max(1, input.max),
        };
        setInventory((prev) => {
          const next = [...prev, newInv];
          setLocal(LOCAL_INV_KEY, next);
          return next;
        });
        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("inventory")
            .insert({
              id: newInv.id,
              name: newInv.name,
              current: newInv.current,
              max: newInv.max,
            })
            .then(() => { }, () => { });
        }
        toast.success(`Inventory item "${newInv.name}" added`);
      },
      updateInventoryItem: async (id, input) => {
        const trimmed = input.name.trim();
        const current = Math.max(0, input.current);
        const max = Math.max(1, input.max);
        setInventory((prev) => {
          const next = prev.map((n) =>
            n.id === id ? { ...n, name: trimmed, current, max } : n,
          );
          setLocal(LOCAL_INV_KEY, next);
          return next;
        });
        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("inventory")
            .update({ name: trimmed, current, max })
            .eq("id", id)
            .then(() => { }, () => { });
        }
        toast.success(`"${trimmed}" stock updated`);
      },
      updateStock: async (id, current, max) => {
        const safeCur = Math.max(0, current);
        const safeMax = Math.max(1, max);
        setInventory((prev) => {
          const next = prev.map((n) =>
            n.id === id ? { ...n, current: safeCur, max: safeMax } : n,
          );
          setLocal(LOCAL_INV_KEY, next);
          return next;
        });
        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("inventory")
            .update({ current: safeCur, max: safeMax })
            .eq("id", id)
            .then(() => { }, () => { });
        }
      },
      deleteInventoryItem: async (id: string) => {
        const target = inventory.find((n) => n.id === id);
        setInventory((prev) => {
          const next = prev.filter((n) => n.id !== id);
          setLocal(LOCAL_INV_KEY, next);
          return next;
        });
        if (supabase && isSupabaseConfigured) {
          await supabase.from("inventory").delete().eq("id", id).then(() => { }, () => { });
        }
        toast.success(`Inventory item "${target?.name || ""}" removed`);
      },
      placeOrder: async (lines) => {
        const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

        const maxNum = orders.reduce((max, o) => {
          const num = parseInt(o.id.replace(/\D/g, ""), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const nextNum = Math.max(maxNum + 1, orderNo);
        const id = `#${String(nextNum).padStart(4, "0")}`;
        const createdAt = new Date().toISOString();
        const newOrder: Order = { id, lines, total, status: "New", createdAt };

        setOrderNo(nextNum + 1);
        setOrders((prev) => {
          const next = [newOrder, ...prev.filter((o) => o.id !== id)];
          setLocal(LOCAL_ORDER_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase.from("orders").insert({
            id: newOrder.id,
            lines: newOrder.lines,
            total: newOrder.total,
            status: newOrder.status,
          });
          if (error && !isNetworkError(error)) {
            console.error("Supabase insert order error:", error);
          }
        }
      },
      advanceOrder: async (id) => {
        const flow: OrderStatus[] = ["New", "Preparing", "Served", "Past Orders"];

        const target = orders.find((o) => o.id === id);
        if (!target) return;

        const idx = flow.indexOf(target.status);
        const nextStatus = flow[Math.min(idx + 1, flow.length - 1)];

        setOrders((prev) => {
          const next = prev.map((o) =>
            o.id === id ? { ...o, status: nextStatus } : o,
          );
          setLocal(LOCAL_ORDER_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("orders")
            .update({ status: nextStatus })
            .eq("id", id)
            .then(() => { }, () => { });
        }
        toast.success(`Order ${id} moved to ${nextStatus}`);
      },
      closeOrder: async (id, paymentMethod, paymentDetails, total) => {
        const orderTotal = total ?? orders.find((order) => order.id === id)?.total;
        setOrders((prev) => {
          const next = prev.map((o) => {
            if (o.id !== id) return o;
            return {
              ...o,
              total: total ?? o.total,
              status: "Past Orders" as OrderStatus,
              paymentMethod,
              paymentDetails,
            };
          });
          setLocal(LOCAL_ORDER_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase
            .from("orders")
            .update({
              ...(orderTotal !== undefined ? { total: orderTotal } : {}),
              status: "Past Orders",
              payment_method: paymentMethod,
              payment_details: paymentDetails || null,
            })
            .eq("id", id);

          if (error && !isNetworkError(error)) {
            await supabase
              .from("orders")
              .update({ ...(orderTotal !== undefined ? { total: orderTotal } : {}), status: "Past Orders" })
              .eq("id", id)
              .then(() => { }, () => { });
          }
        }
        toast.success(`Order ${id} closed (${paymentMethod})`);
      },
      deleteOrder: async (id: string) => {
        setOrders((prev) => {
          const next = prev.filter((o) => o.id !== id);
          setLocal(LOCAL_ORDER_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase.from("orders").delete().eq("id", id).then(() => { }, () => { });
        }
        toast.success(`Order ${id} deleted`);
      },
      clearAllOrders: async () => {
        setOrders([]);
        setOrderNo(1);
        setLocal(LOCAL_ORDER_KEY, []);

        if (supabase && isSupabaseConfigured) {
          await supabase.from("orders").delete().neq("id", "___NONE___").then(() => { }, () => { });
        }
        toast.success("All orders cleared");
      },
      addStaff: async (input) => {
        const name = input.name.trim();
        const phone = input.phone.trim();
        const password = input.password.trim();
        if (!name || !phone || !password) {
          toast.error("Please provide Name, Phone Number, and Password");
          return;
        }

        const newStaff: StaffMember = {
          id: generateId("staff"),
          name,
          phone,
          password,
          createdAt: new Date().toISOString(),
        };

        setStaff((prev) => {
          const next = [...prev, newStaff];
          setLocal(LOCAL_STAFF_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("staff")
            .insert({
              id: newStaff.id,
              name: newStaff.name,
              phone: newStaff.phone,
              password: newStaff.password,
            })
            .then(() => { }, () => { });
        }
        toast.success(`Staff member "${name}" added`);
      },
      updateStaff: async (id, input) => {
        const name = input.name.trim();
        const phone = input.phone.trim();
        const password = input.password.trim();

        setStaff((prev) => {
          const next = prev.map((s) =>
            s.id === id ? { ...s, name, phone, password } : s,
          );
          setLocal(LOCAL_STAFF_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("staff")
            .update({ name, phone, password })
            .eq("id", id)
            .then(() => { }, () => { });
        }
        toast.success("Staff details updated");
      },
      deleteStaff: async (id) => {
        const target = staff.find((s) => s.id === id);
        setStaff((prev) => {
          const next = prev.filter((s) => s.id !== id);
          setLocal(LOCAL_STAFF_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase.from("staff").delete().eq("id", id).then(() => { }, () => { });
        }
        toast.success(`Staff "${target?.name || ""}" removed`);
      },
      addExpense: async (input) => {
        const newExp: Expense = {
          id: generateId("exp"),
          title: input.title.trim(),
          category: input.category,
          amount: input.amount,
          paymentMethod: input.paymentMethod || "Cash",
          notes: input.notes?.trim() || "",
          date: input.date || new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
        };

        setExpenses((prev) => {
          const next = [newExp, ...prev];
          setLocal(LOCAL_EXPENSE_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("expenses")
            .insert({
              id: newExp.id,
              title: newExp.title,
              category: newExp.category,
              amount: newExp.amount,
              payment_method: newExp.paymentMethod,
              notes: newExp.notes,
              date: newExp.date,
            })
            .then(() => { }, () => { });
        }
        toast.success(`Expense "${newExp.title}" recorded`);
      },
      updateExpense: async (id, input) => {
        const title = input.title.trim();
        const notes = input.notes?.trim() || "";
        const date = input.date || new Date().toISOString().split("T")[0];
        const paymentMethod = input.paymentMethod || "Cash";

        setExpenses((prev) => {
          const next = prev.map((e) =>
            e.id === id
              ? {
                ...e,
                title,
                category: input.category,
                amount: input.amount,
                paymentMethod,
                notes,
                date,
              }
              : e,
          );
          setLocal(LOCAL_EXPENSE_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("expenses")
            .update({
              title,
              category: input.category,
              amount: input.amount,
              payment_method: paymentMethod,
              notes,
              date,
            })
            .eq("id", id)
            .then(() => { }, () => { });
        }
        toast.success(`Expense "${title}" updated`);
      },
      deleteExpense: async (id: string) => {
        const target = expenses.find((e) => e.id === id);
        setExpenses((prev) => {
          const next = prev.filter((e) => e.id !== id);
          setLocal(LOCAL_EXPENSE_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          await supabase.from("expenses").delete().eq("id", id).then(() => { }, () => { });
        }
        toast.success(`Expense "${target?.title || ""}" deleted`);
      },
      clearAllExpenses: async () => {
        setExpenses([]);
        setLocal(LOCAL_EXPENSE_KEY, []);

        if (supabase && isSupabaseConfigured) {
          await supabase.from("expenses").delete().neq("id", "___NONE___").then(() => { }, () => { });
        }
        toast.success("All expenses cleared");
      },
      resetShopData: async (options = {
        clearOrders: true,
        clearExpenses: true,
        resetMenu: true,
        resetInventory: true,
      }) => {
        if (options.clearOrders) {
          setOrders([]);
          setOrderNo(1);
          setLocal(LOCAL_ORDER_KEY, []);
          if (supabase && isSupabaseConfigured) {
            await supabase.from("orders").delete().neq("id", "___NONE___").then(() => { }, () => { });
          }
        }
        if (options.clearExpenses) {
          setExpenses([]);
          setLocal(LOCAL_EXPENSE_KEY, []);
          if (supabase && isSupabaseConfigured) {
            await supabase.from("expenses").delete().neq("id", "___NONE___").then(() => { }, () => { });
          }
        }
        if (options.resetMenu) {
          setCategories(initialCategories);
          setItems(initialItems);
          setLocal(LOCAL_CAT_KEY, initialCategories);
          setLocal(LOCAL_ITEM_KEY, initialItems);
          if (supabase && isSupabaseConfigured) {
            for (const c of initialCategories) {
              await supabase.from("categories").upsert(c).then(() => { }, () => { });
            }
            for (const i of initialItems) {
              await supabase
                .from("menu_items")
                .upsert({
                  id: i.id,
                  name: i.name,
                  price: i.price,
                  category_id: i.categoryId,
                  variants: i.variants,
                  enabled: i.enabled,
                })
                .then(() => { }, () => { });
            }
          }
        }
        if (options.resetInventory) {
          setInventory(initialInventory);
          setLocal(LOCAL_INV_KEY, initialInventory);
        }
        toast.success("Shop database cleaned and ready for operation!");
      },
      loginAsStaff: async (phone, pass) => {
        let found = staff.find(
          (s) => s.phone.trim() === phone.trim() && s.password === pass.trim(),
        );

        if (!found && supabase && isSupabaseConfigured) {
          try {
            const { data, error } = await supabase
              .from("staff")
              .select("*")
              .eq("phone", phone.trim())
              .eq("password", pass.trim())
              .maybeSingle();

            if (data && !error) {
              found = {
                id: data.id,
                name: data.name,
                phone: data.phone,
                password: data.password,
                createdAt: data.created_at,
              };
              setStaff((prev) => {
                if (!prev.some((s) => s.id === found!.id)) {
                  const next = [...prev, found!];
                  setLocal(LOCAL_STAFF_KEY, next);
                  return next;
                }
                return prev;
              });
            }
          } catch {
            // Offline fallback
          }
        }

        if (found) {
          const userState: CurrentUser = {
            role: "Staff",
            staffMember: found,
            isAuthenticated: true,
          };
          setCurrentUser(userState);
          setLocal(LOCAL_USER_KEY, userState);
          toast.success(`Welcome ${found.name}! Access limited to POS & Orders.`);
          return true;
        }
        toast.error("Invalid Staff Phone Number or Password");
        return false;
      },
      loginAsAdmin: (pass) => {
        if (pass.trim() === "1234" || pass.trim() === "admin") {
          const userState: CurrentUser = { role: "Admin", isAuthenticated: true };
          setCurrentUser(userState);
          setLocal(LOCAL_USER_KEY, userState);
          toast.success("Welcome Admin! Full Dashboard access granted.");
          return true;
        }
        toast.error("Incorrect Admin Password (default is 1234)");
        return false;
      },
      switchToAdmin: (pass) => {
        if (pass.trim() === "1234" || pass.trim() === "admin") {
          const userState: CurrentUser = { role: "Admin", isAuthenticated: true };
          setCurrentUser(userState);
          setLocal(LOCAL_USER_KEY, userState);
          toast.success("Switched to Admin Mode (Full Access)");
          return true;
        }
        toast.error("Incorrect Admin Password (default is 1234)");
        return false;
      },
      logout: () => {
        setCurrentUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(LOCAL_USER_KEY);
        }
        toast.info("Logged out successfully");
      },
    }),
    [
      categories,
      items,
      inventory,
      orders,
      expenses,
      staff,
      currentUser,
      orderNo,
      isSynced,
      dateRange,
      outletInfo,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
