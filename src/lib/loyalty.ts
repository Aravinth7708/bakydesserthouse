import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type LoyaltyMenuItem = {
  id: string;
  name: string;
  price: number;
  variants: string[];
  categoryId: string;
  categoryName: string;
};

export type LoyaltyOrderItem = {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  variant: string | null;
};

export type LoyaltyOrder = {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  shop_order_id?: string | null;
  items: LoyaltyOrderItem[];
  fulfillment_type: "Dine In" | "Takeaway";
  takeaway_fee: number;
  total: number;
  status: "New" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  points_earned: number;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
};

export type LoyaltyCustomer = {
  id: string;
  name: string;
  phone: string;
  points_balance: number;
  spend_remainder: number;
  created_at: string;
};

export type LoyaltyClaim = {
  id: string;
  customer_id: string;
  reward_name: string;
  points_spent: number;
  status: "Pending" | "Redeemed" | "Cancelled";
  created_at: string;
  redeemed_at?: string | null;
  redeemed_by?: string | null;
};

function ensureSupabase() {
  if (!supabase || !isSupabaseConfigured)
    throw new Error("Loyalty service is not connected to Supabase.");
}

export async function loadLoyaltyMenu(): Promise<LoyaltyMenuItem[]> {
  ensureSupabase();
  const [menuResult, categoriesResult] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id,name,price,variants,category_id")
      .eq("enabled", true)
      .order("name"),
    supabase.from("categories").select("id,name").eq("enabled", true),
  ]);
  if (menuResult.error) throw new Error(menuResult.error.message);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  const categoryNames = new Map(
    (categoriesResult.data || []).map((category) => [category.id, category.name]),
  );
  return (menuResult.data || []).map((item) => ({
    id: String(item.id),
    name: String(item.name),
    price: Number(item.price),
    variants: Array.isArray(item.variants) ? item.variants : [],
    categoryId: String(item.category_id || ""),
    categoryName: categoryNames.get(String(item.category_id || "")) || "Other",
  }));
}

export async function submitLoyaltyOrder(
  name: string,
  phone: string,
  items: Array<{ itemId: string; qty: number; variant?: string }>,
  fulfillmentType: "Dine In" | "Takeaway",
) {
  ensureSupabase();
  const { data, error } = await supabase.rpc("place_loyalty_order", {
    p_name: name.trim(),
    p_phone: phone,
    p_items: items,
    p_fulfillment_type: fulfillmentType,
  });
  if (error) throw new Error(error.message);
  return String(data);
}

export async function getLoyaltyCustomer(phone: string) {
  ensureSupabase();
  const normalizedPhone = phone.replace(/\D/g, "");
  const { data: customer, error } = await supabase
    .from("loyalty_customers")
    .select("*")
    .eq("phone", normalizedPhone)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!customer) return null;

  const [ordersResult, ledgerResult, claimsResult] = await Promise.all([
    supabase
      .from("loyalty_orders")
      .select(
        "id,shop_order_id,total,status,points_earned,created_at,items,fulfillment_type,takeaway_fee",
      )
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("loyalty_points_ledger")
      .select("id,points_delta,entry_type,description,created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("loyalty_reward_claims")
      .select("id,reward_name,points_spent,status,created_at,redeemed_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const nestedError = ordersResult.error || ledgerResult.error || claimsResult.error;
  if (nestedError) throw new Error(nestedError.message);
  return {
    customer: customer as LoyaltyCustomer,
    orders: (ordersResult.data || []) as Array<
      Pick<
        LoyaltyOrder,
        | "id"
        | "shop_order_id"
        | "total"
        | "status"
        | "points_earned"
        | "created_at"
        | "items"
        | "fulfillment_type"
        | "takeaway_fee"
      >
    >,
    ledger: ledgerResult.data || [],
    claims: (claimsResult.data || []) as LoyaltyClaim[],
  };
}

export async function claimFreeBrownie(phone: string) {
  ensureSupabase();
  const { data, error } = await supabase.rpc("claim_loyalty_brownie", { p_phone: phone });
  if (error) throw new Error(error.message);
  return String(data);
}

export async function loadLoyaltyOperations() {
  ensureSupabase();
  const [ordersResult, customersResult, claimsResult] = await Promise.all([
    supabase
      .from("loyalty_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("loyalty_customers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("loyalty_reward_claims")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);
  const error = ordersResult.error || customersResult.error || claimsResult.error;
  if (error) throw new Error(error.message);
  return {
    orders: (ordersResult.data || []) as LoyaltyOrder[],
    customers: (customersResult.data || []) as LoyaltyCustomer[],
    claims: (claimsResult.data || []) as LoyaltyClaim[],
  };
}

export async function updateLoyaltyOrder(
  order: LoyaltyOrder,
  status: LoyaltyOrder["status"],
  staffName: string,
): Promise<number | string> {
  ensureSupabase();
  if (status === "Preparing") {
    const { data, error } = await supabase.rpc("confirm_loyalty_order", {
      p_order_id: order.id,
      p_staff_name: staffName,
    });
    if (error) {
      if (error.code === "PGRST202" || /confirm_loyalty_order|schema cache/i.test(error.message)) {
        throw new Error(
          "The Supabase order-sync migration is missing. Run the updated supabase_loyalty_migration.sql in Supabase SQL Editor, then refresh this page.",
        );
      }
      if (error.code === "23505" && /loyalty_orders_shop_order_id_unique/i.test(error.message)) {
        throw new Error(
          "Supabase is reusing an order number saved in loyalty history. Run the updated supabase_loyalty_migration.sql in SQL Editor, then try again.",
        );
      }
      throw new Error(error.message);
    }
    return String(data);
  }
  if (status === "Completed") {
    const { data, error } = await supabase.rpc("complete_loyalty_order", {
      p_order_id: order.id,
      p_staff_name: staffName,
    });
    if (error) throw new Error(error.message);
    return Number(data || 0);
  }
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "Preparing") {
    update.verified_by = staffName;
    update.verified_at = new Date().toISOString();
  }
  const { error } = await supabase.from("loyalty_orders").update(update).eq("id", order.id);
  if (error) throw new Error(error.message);
  return 0;
}

export async function updateLoyaltyClaim(claimId: string, staffName: string) {
  ensureSupabase();
  const { error } = await supabase
    .from("loyalty_reward_claims")
    .update({ status: "Redeemed", redeemed_at: new Date().toISOString(), redeemed_by: staffName })
    .eq("id", claimId)
    .eq("status", "Pending");
  if (error) throw new Error(error.message);
}

export async function getLoyaltyAdminData() {
  ensureSupabase();
  const [customersResult, ledgerResult, claimsResult, ordersResult] = await Promise.all([
    supabase
      .from("loyalty_customers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("loyalty_points_ledger")
      .select("customer_id,points_delta,entry_type,created_at")
      .order("created_at", { ascending: false })
      .limit(3000),
    supabase
      .from("loyalty_reward_claims")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("loyalty_orders")
      .select("customer_id,total,status,points_earned,created_at")
      .order("created_at", { ascending: false })
      .limit(3000),
  ]);
  const error =
    customersResult.error || ledgerResult.error || claimsResult.error || ordersResult.error;
  if (error) throw new Error(error.message);
  return {
    customers: (customersResult.data || []) as LoyaltyCustomer[],
    ledger: ledgerResult.data || [],
    claims: (claimsResult.data || []) as LoyaltyClaim[],
    orders: ordersResult.data || [],
  };
}
