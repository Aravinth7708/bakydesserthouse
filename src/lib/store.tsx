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

export type OrderLine = { name: string; price: number; qty: number };

export type Order = {
  id: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod | string;
  paymentDetails?: string;
};

export type StaffMember = {
  id: string;
  name: string;
  phone: string;
  password: string;
  createdAt?: string;
};

export type UserRole = "Admin" | "Staff";

export type CurrentUser = {
  role: UserRole;
  staffMember?: StaffMember;
  isAuthenticated: boolean;
};

type Store = {
  categories: Category[];
  items: MenuItem[];
  inventory: InventoryItem[];
  orders: Order[];
  staff: StaffMember[];
  currentUser: CurrentUser | null;
  isSynced: boolean;
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
  updateStock: (id: string, current: number, max: number) => Promise<void>;
  placeOrder: (lines: OrderLine[]) => Promise<void>;
  advanceOrder: (id: string) => Promise<void>;
  closeOrder: (
    id: string,
    paymentMethod: PaymentMethod | string,
    paymentDetails?: string,
  ) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  clearAllOrders: () => Promise<void>;
  addStaff: (input: { name: string; phone: string; password: string }) => Promise<void>;
  updateStaff: (
    id: string,
    input: { name: string; phone: string; password: string },
  ) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  loginAsStaff: (phone: string, pass: string) => Promise<boolean>;
  loginAsAdmin: (pass: string) => boolean;
  switchToAdmin: (pass: string) => boolean;
  logout: () => void;
};

const StoreContext = createContext<Store | null>(null);

let seq = 100;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

const initialCategories: Category[] = [
  { id: "c1", name: "Waffle", enabled: true },
  { id: "c2", name: "Shakes", enabled: true },
  { id: "c3", name: "Signature", enabled: true },
  { id: "c4", name: "Brownie", enabled: true },
];

const initialItems: MenuItem[] = [
  {
    id: "i1",
    name: "Hazelnut Waffle",
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
    name: "Choco Shake",
    price: 120,
    categoryId: "c2",
    variants: [],
    enabled: true,
  },
];

const initialInventory: InventoryItem[] = [
  { id: "n1", name: "Waffle Flour (kg)", current: 2, max: 10 },
  { id: "n2", name: "Brownie Plates (Pack)", current: 7, max: 10 },
  { id: "n3", name: "Dark Compound (Pack)", current: 1, max: 10 },
];

const initialOrders: Order[] = [];

const LOCAL_CAT_KEY = "baky_categories_v1";
const LOCAL_ITEM_KEY = "baky_items_v1";
const LOCAL_INV_KEY = "baky_inventory_v1";
const LOCAL_ORDER_KEY = "baky_orders_v1";
const LOCAL_STAFF_KEY = "baky_staff_v1";
const LOCAL_USER_KEY = "baky_user_v1";

const initialStaff: StaffMember[] = [
  {
    id: "s1",
    name: "Staff 1",
    phone: "9876543210",
    password: "1234",
  },
];

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
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
  const [categories, setCategories] = useState<Category[]>(() =>
    getLocal(LOCAL_CAT_KEY, initialCategories),
  );
  const [items, setItems] = useState<MenuItem[]>(() =>
    getLocal(LOCAL_ITEM_KEY, initialItems),
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    getLocal(LOCAL_INV_KEY, initialInventory),
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    getLocal(LOCAL_ORDER_KEY, initialOrders),
  );
  const [staff, setStaff] = useState<StaffMember[]>(() =>
    getLocal(LOCAL_STAFF_KEY, initialStaff),
  );
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = getLocal<any>(LOCAL_USER_KEY, null);
    if (saved && typeof saved === "object" && (saved.role === "Admin" || saved.role === "Staff") && saved.isAuthenticated) {
      return saved as CurrentUser;
    }
    return null;
  });
  const [orderNo, setOrderNo] = useState(1);
  const [isSynced, setIsSynced] = useState(false);

  const generateId = (prefix: string) => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  };

  // Fetch initial data from Supabase
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const results = await Promise.allSettled([
          supabase.from("categories").select("*").order("created_at", { ascending: true }),
          supabase.from("menu_items").select("*").order("created_at", { ascending: true }),
          supabase.from("inventory").select("*").order("created_at", { ascending: true }),
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
          supabase.from("staff").select("*").order("created_at", { ascending: true }),
        ]);

        if (!mounted) return;

        const catRes = results[0].status === "fulfilled" ? results[0].value : null;
        const itemRes = results[1].status === "fulfilled" ? results[1].value : null;
        const invRes = results[2].status === "fulfilled" ? results[2].value : null;
        const orderRes = results[3].status === "fulfilled" ? results[3].value : null;
        const staffRes = results[4].status === "fulfilled" ? results[4].value : null;

        if (catRes?.data && catRes.data.length > 0) {
          const loadedCats = catRes.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            enabled: c.enabled,
          }));
          setCategories(loadedCats);
          setLocal(LOCAL_CAT_KEY, loadedCats);
        }

        if (itemRes?.data && itemRes.data.length > 0) {
          const loadedItems = itemRes.data.map((i: any) => ({
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

        if (orderRes?.data && orderRes.data.length > 0) {
          const loadedOrders = orderRes.data.map((o: any) => ({
            id: o.id,
            lines: o.lines || [],
            total: Number(o.total),
            status: o.status,
            paymentMethod: o.payment_method || o.paymentMethod || undefined,
            paymentDetails: o.payment_details || o.paymentDetails || undefined,
          }));

          // Calculate highest numerical order number across all orders
          const maxNum = loadedOrders.reduce((max: number, o: any) => {
            const num = parseInt(o.id.replace(/\D/g, ""), 10);
            return isNaN(num) ? max : Math.max(max, num);
          }, 0);
          setOrderNo(maxNum + 1);

          setOrders(loadedOrders);
          setLocal(LOCAL_ORDER_KEY, loadedOrders);
        } else if (orderRes?.data && orderRes.data.length === 0) {
          setOrders([]);
          setOrderNo(1);
          setLocal(LOCAL_ORDER_KEY, []);
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
        } else if (staffRes?.data && staffRes.data.length === 0) {
          for (const s of initialStaff) {
            await supabase.from("staff").insert({
              id: s.id,
              name: s.name,
              phone: s.phone,
              password: s.password,
            });
          }
        }

        setIsSynced(true);
      } catch (err) {
        console.error("Failed to load data from Supabase:", err);
      }
    }

    loadData();

    // Re-sync on window focus / tab visibility change
    const handleSync = () => {
      loadData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleSync);
      window.addEventListener("visibilitychange", handleSync);
    }

    // Fast periodic polling for live multi-device synchronization
    const pollInterval = setInterval(() => {
      loadData();
    }, 4000);

    // Setup Supabase Realtime channel for live syncing
    const channel = supabase
      .channel("public-db-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleSync);
        window.removeEventListener("visibilitychange", handleSync);
      }
      supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo<Store>(
    () => ({
      categories,
      items,
      inventory,
      orders,
      staff,
      currentUser,
      isSynced,
      addCategory: async (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const newCat: Category = { id: generateId("cat"), name: trimmed, enabled: true };
        
        // Optimistically update state & local storage
        setCategories((prev) => {
          const next = [...prev, newCat];
          setLocal(LOCAL_CAT_KEY, next);
          return next;
        });

        // Persist to Supabase
        const { error } = await supabase.from("categories").insert({
          id: newCat.id,
          name: newCat.name,
          enabled: newCat.enabled,
        });

        if (error) {
          console.error("Supabase insert category error:", error);
          toast.error(`Database error: ${error.message}`);
          return;
        }

        toast.success(`Category "${trimmed}" added and saved`);
      },
      updateCategory: async (id: string, name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        setCategories((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c));
          setLocal(LOCAL_CAT_KEY, next);
          return next;
        });

        const { error } = await supabase
          .from("categories")
          .update({ name: trimmed })
          .eq("id", id);

        if (error) {
          console.error("Supabase update category error:", error);
          toast.error(`Database error: ${error.message}`);
          return;
        }

        toast.success(`Category renamed to "${trimmed}"`);
      },
      deleteCategory: async (id: string) => {
        const target = categories.find((c) => c.id === id);
        setCategories((prev) => {
          const next = prev.filter((c) => c.id !== id);
          setLocal(LOCAL_CAT_KEY, next);
          return next;
        });
        setItems((prev) => {
          const next = prev.filter((i) => i.categoryId !== id);
          setLocal(LOCAL_ITEM_KEY, next);
          return next;
        });

        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) {
          console.error("Supabase delete category error:", error);
          toast.error(`Database error: ${error.message}`);
          return;
        }

        toast.success(`Category "${target?.name || ''}" deleted`);
      },
      toggleCategory: async (id: string) => {
        const target = categories.find((c) => c.id === id);
        if (!target) return;
        const nextEnabled = !target.enabled;
        setCategories((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, enabled: nextEnabled } : c));
          setLocal(LOCAL_CAT_KEY, next);
          return next;
        });

        const { error } = await supabase
          .from("categories")
          .update({ enabled: nextEnabled })
          .eq("id", id);

        if (error) {
          console.error("Supabase toggle category error:", error);
          toast.error(`Database error: ${error.message}`);
          return;
        }

        toast.success(
          nextEnabled
            ? `Category "${target.name}" enabled in POS`
            : `Category "${target.name}" hidden from POS`,
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

        const { error } = await supabase.from("menu_items").insert({
          id: newItem.id,
          name: newItem.name,
          price: newItem.price,
          category_id: newItem.categoryId,
          variants: newItem.variants,
          enabled: newItem.enabled,
        });

        if (error) {
          console.error("Supabase insert item error:", error);
          toast.error(`Database error: ${error.message}`);
          return;
        }

        toast.success(`Item "${newItem.name}" added and saved`);
      },
      updateItem: async (id, input) => {
        const trimmed = input.name.trim();
        setItems((prev) => {
          const next = prev.map((i) =>
            i.id === id
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

        const { error } = await supabase
          .from("menu_items")
          .update({
            name: trimmed,
            price: input.price,
            category_id: input.categoryId,
            variants: input.variants,
          })
          .eq("id", id);

        if (error) {
          console.error("Supabase update item error:", error);
          toast.error(`Database error: ${error.message}`);
          return;
        }

        toast.success(`Item "${trimmed}" updated`);
      },
      deleteItem: async (id: string) => {
        const target = items.find((i) => i.id === id);
        setItems((prev) => {
          const next = prev.filter((i) => i.id !== id);
          setLocal(LOCAL_ITEM_KEY, next);
          return next;
        });

        const { error } = await supabase.from("menu_items").delete().eq("id", id);
        if (error) {
          console.error("Supabase delete item error:", error);
          toast.error(`Database error: ${error.message}`);
          return;
        }

        toast.success(`Item "${target?.name || ''}" deleted`);
      },
      toggleItem: async (id: string) => {
        const target = items.find((i) => i.id === id);
        if (!target) return;
        const nextEnabled = !target.enabled;
        setItems((prev) => {
          const next = prev.map((i) => (i.id === id ? { ...i, enabled: nextEnabled } : i));
          setLocal(LOCAL_ITEM_KEY, next);
          return next;
        });

        const { error } = await supabase
          .from("menu_items")
          .update({ enabled: nextEnabled })
          .eq("id", id);

        if (error) {
          console.error("Supabase toggle item error:", error);
          toast.error(`Database error: ${error.message}`);
          return;
        }

        toast.success(
          nextEnabled
            ? `"${target.name}" enabled in POS`
            : `"${target.name}" hidden from POS`,
        );
      },
      addInventoryItem: async (input) => {
        const newInv: InventoryItem = { id: nextId("n"), ...input };
        setInventory((prev) => [...prev, newInv]);
        if (supabase && isSupabaseConfigured) {
          await supabase.from("inventory").insert({
            id: newInv.id,
            name: newInv.name,
            current: newInv.current,
            max: newInv.max,
          });
        }
      },
      updateStock: async (id, current, max) => {
        setInventory((prev) =>
          prev.map((n) => (n.id === id ? { ...n, current, max } : n)),
        );
        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("inventory")
            .update({ current, max })
            .eq("id", id);
        }
      },
      placeOrder: async (lines) => {
        const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
        
        // Compute unique next order ID
        const maxNum = orders.reduce((max, o) => {
          const num = parseInt(o.id.replace(/\D/g, ""), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const nextNum = Math.max(maxNum + 1, orderNo);
        const id = `#${String(nextNum).padStart(4, "0")}`;
        const newOrder: Order = { id, lines, total, status: "New" };

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
          if (error) {
            console.error("Supabase insert order error:", error);
            toast.error(`Database error placing order: ${error.message}`);
          }
        }
      },
      advanceOrder: async (id) => {
        const flow: OrderStatus[] = [
          "New",
          "Preparing",
          "Served",
          "Past Orders",
        ];
        let nextStatus: OrderStatus = "New";
        setOrders((prev) => {
          const next = prev.map((o) => {
            if (o.id !== id) return o;
            const idx = flow.indexOf(o.status);
            nextStatus = flow[Math.min(idx + 1, flow.length - 1)];
            return { ...o, status: nextStatus };
          });
          setLocal(LOCAL_ORDER_KEY, next);
          return next;
        });

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase
            .from("orders")
            .update({ status: nextStatus })
            .eq("id", id);
          if (error) {
            console.error("Supabase advance order error:", error);
          }
        }
      },
      closeOrder: async (id, paymentMethod, paymentDetails) => {
        setOrders((prev) => {
          const next = prev.map((o) => {
            if (o.id !== id) return o;
            return {
              ...o,
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
              status: "Past Orders",
              payment_method: paymentMethod,
              payment_details: paymentDetails || null,
            })
            .eq("id", id);
          if (error) {
            console.error("Supabase close order error:", error);
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
          const { error } = await supabase.from("orders").delete().eq("id", id);
          if (error) {
            console.error("Supabase delete order error:", error);
            toast.error(`Database error deleting order: ${error.message}`);
            return;
          }
        }
        toast.success(`Order ${id} deleted`);
      },
      clearAllOrders: async () => {
        setOrders([]);
        setOrderNo(1);
        setLocal(LOCAL_ORDER_KEY, []);

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase.from("orders").delete().neq("id", "");
          if (error) {
            console.error("Supabase clear orders error:", error);
            toast.error(`Database error clearing orders: ${error.message}`);
            return;
          }
        }
        toast.success("All orders cleared successfully");
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
          const { error } = await supabase.from("staff").insert({
            id: newStaff.id,
            name: newStaff.name,
            phone: newStaff.phone,
            password: newStaff.password,
          });
          if (error) {
            console.error("Supabase staff insert error:", error);
            toast.error(`Database error adding staff: ${error.message}`);
            return;
          }
        }
        toast.success(`Staff member "${name}" added and synced`);
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
          const { error } = await supabase
            .from("staff")
            .update({ name, phone, password })
            .eq("id", id);
          if (error) {
            console.error("Supabase staff update error:", error);
            toast.error(`Database error updating staff: ${error.message}`);
            return;
          }
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
          const { error } = await supabase.from("staff").delete().eq("id", id);
          if (error) {
            console.error("Supabase staff delete error:", error);
            toast.error(`Database error removing staff: ${error.message}`);
            return;
          }
        }
        toast.success(`Staff "${target?.name || ''}" removed`);
      },
      loginAsStaff: async (phone, pass) => {
        let found = staff.find(
          (s) => s.phone.trim() === phone.trim() && s.password === pass.trim(),
        );

        // Fallback: If not found in local memory, check live Supabase database directly
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
          } catch (e) {
            console.warn("Direct Supabase staff login lookup error:", e);
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
    [categories, items, inventory, orders, staff, currentUser, orderNo, isSynced],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
