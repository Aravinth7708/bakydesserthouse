import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

export type OrderLine = { name: string; price: number; qty: number };

export type Order = {
  id: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
};

type Store = {
  categories: Category[];
  items: MenuItem[];
  inventory: InventoryItem[];
  orders: Order[];
  isSynced: boolean;
  addCategory: (name: string) => Promise<void> | void;
  toggleCategory: (id: string) => Promise<void> | void;
  addItem: (input: {
    name: string;
    price: number;
    categoryId: string;
    variants: string[];
  }) => Promise<void> | void;
  toggleItem: (id: string) => Promise<void> | void;
  addInventoryItem: (input: { name: string; current: number; max: number }) => Promise<void> | void;
  updateStock: (id: string, current: number, max: number) => Promise<void> | void;
  placeOrder: (lines: OrderLine[]) => Promise<void> | void;
  advanceOrder: (id: string) => Promise<void> | void;
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
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderNo, setOrderNo] = useState(1);
  const [isSynced, setIsSynced] = useState(false);

  // Fetch initial data from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let mounted = true;

    async function loadData() {
      if (!supabase) return;
      try {
        const [catRes, itemRes, invRes, orderRes] = await Promise.all([
          supabase.from("categories").select("*").order("created_at", { ascending: true }),
          supabase.from("menu_items").select("*").order("created_at", { ascending: true }),
          supabase.from("inventory").select("*").order("created_at", { ascending: true }),
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
        ]);

        if (!mounted) return;

        if (catRes.data && catRes.data.length > 0) {
          setCategories(
            catRes.data.map((c: any) => ({
              id: c.id,
              name: c.name,
              enabled: c.enabled,
            })),
          );
        }

        if (itemRes.data && itemRes.data.length > 0) {
          setItems(
            itemRes.data.map((i: any) => ({
              id: i.id,
              name: i.name,
              price: Number(i.price),
              categoryId: i.category_id,
              variants: i.variants || [],
              enabled: i.enabled,
            })),
          );
        }

        if (invRes.data && invRes.data.length > 0) {
          setInventory(
            invRes.data.map((n: any) => ({
              id: n.id,
              name: n.name,
              current: Number(n.current),
              max: Number(n.max),
            })),
          );
        }

        if (orderRes.data && orderRes.data.length > 0) {
          setOrders(
            orderRes.data.map((o: any) => ({
              id: o.id,
              lines: o.lines || [],
              total: Number(o.total),
              status: o.status,
            })),
          );
          setOrderNo(orderRes.data.length + 1);
        }

        setIsSynced(true);
      } catch (err) {
        console.error("Failed to load data from Supabase:", err);
      }
    }

    loadData();

    // Setup Supabase Realtime channel for live syncing
    const channel = supabase
      .channel("public-db-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo<Store>(
    () => ({
      categories,
      items,
      inventory,
      orders,
      isSynced,
      addCategory: async (name) => {
        const newCat: Category = { id: nextId("c"), name, enabled: true };
        setCategories((prev) => [...prev, newCat]);
        if (supabase && isSupabaseConfigured) {
          await supabase.from("categories").insert({
            id: newCat.id,
            name: newCat.name,
            enabled: newCat.enabled,
          });
        }
      },
      toggleCategory: async (id) => {
        const target = categories.find((c) => c.id === id);
        const nextEnabled = target ? !target.enabled : true;
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, enabled: nextEnabled } : c)),
        );
        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("categories")
            .update({ enabled: nextEnabled })
            .eq("id", id);
        }
      },
      addItem: async (input) => {
        const newItem: MenuItem = { id: nextId("i"), enabled: true, ...input };
        setItems((prev) => [...prev, newItem]);
        if (supabase && isSupabaseConfigured) {
          await supabase.from("menu_items").insert({
            id: newItem.id,
            name: newItem.name,
            price: newItem.price,
            category_id: newItem.categoryId,
            variants: newItem.variants,
            enabled: newItem.enabled,
          });
        }
      },
      toggleItem: async (id) => {
        const target = items.find((i) => i.id === id);
        const nextEnabled = target ? !target.enabled : true;
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, enabled: nextEnabled } : i)),
        );
        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("menu_items")
            .update({ enabled: nextEnabled })
            .eq("id", id);
        }
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
        const id = `#${String(orderNo).padStart(4, "0")}`;
        const newOrder: Order = { id, lines, total, status: "New" };
        setOrderNo((n) => n + 1);
        setOrders((prev) => [newOrder, ...prev]);
        if (supabase && isSupabaseConfigured) {
          await supabase.from("orders").insert({
            id: newOrder.id,
            lines: newOrder.lines,
            total: newOrder.total,
            status: newOrder.status,
          });
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
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== id) return o;
            const idx = flow.indexOf(o.status);
            nextStatus = flow[Math.min(idx + 1, flow.length - 1)];
            return { ...o, status: nextStatus };
          }),
        );
        if (supabase && isSupabaseConfigured) {
          await supabase
            .from("orders")
            .update({ status: nextStatus })
            .eq("id", id);
        }
      },
    }),
    [categories, items, inventory, orders, orderNo, isSynced],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
