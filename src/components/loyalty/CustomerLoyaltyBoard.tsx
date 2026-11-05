import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  CheckCircle2,
  ChevronRight,
  CircleMinus,
  CirclePlus,
  Clock3,
  Gift,
  LoaderCircle,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  claimFreeBrownie,
  getLoyaltyCustomer,
  loadLoyaltyMenu,
  normalizeLoyaltyPhone,
  submitLoyaltyOrder,
  type LoyaltyMenuItem,
} from "@/lib/loyalty";

type CartLine = { item: LoyaltyMenuItem; variant: string; qty: number };
type FulfillmentType = "Dine In" | "Takeaway";
type CustomerInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
const CUSTOMER_INSTALL_DISMISSED_KEY = "baky_customer_install_prompt_dismissed";

const money = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

export function CustomerLoyaltyBoard() {
  const { outletInfo } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [identified, setIdentified] = useState(false);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getLoyaltyCustomer>>>(null);
  const [menu, setMenu] = useState<LoyaltyMenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType | "">("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
  const [view, setView] = useState<"order" | "rewards">("order");
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [installPrompt, setInstallPrompt] = useState<CustomerInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const notificationStatuses = useRef(new Map<string, string>());
  const notificationCustomerId = useRef("");
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const activeCustomerId = profile?.customer.id;

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsAppInstalled(standalone);
    setIsIosDevice(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as CustomerInstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
      setShowInstallDialog(false);
      localStorage.removeItem(CUSTOMER_INSTALL_DISMISSED_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadLoyaltyMenu()
      .then((items) => active && setMenu(items))
      .catch((loadError: unknown) => {
        if (active)
          setError(loadError instanceof Error ? loadError.message : "Could not load the menu.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const currentProfile = profileRef.current;
    const customerId = activeCustomerId;
    if (!identified || !customerId || !currentProfile) return;

    const statuses = notificationStatuses.current;
    if (notificationCustomerId.current !== customerId) {
      statuses.clear();
      currentProfile.orders.forEach((order) => statuses.set(order.id, order.status));
      notificationCustomerId.current = customerId;
    }
    let active = true;

    const announceStatus = (orderId: string, nextStatus: string) => {
      const previousStatus = statuses.get(orderId);
      statuses.set(orderId, nextStatus);
      const message =
        nextStatus === "Preparing" && previousStatus !== "Preparing" && previousStatus !== "Ready"
          ? {
              title: "Your order is confirmed",
              body: "The shop has confirmed your order and started preparing it.",
            }
          : nextStatus === "Ready" && previousStatus !== "Ready"
            ? {
                title: "Your order is ready",
                body: "Your order is ready. Please collect it from the shop.",
              }
            : null;
      if (
        !message ||
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      )
        return;

      void (async () => {
        try {
          const registration =
            "serviceWorker" in navigator
              ? await navigator.serviceWorker.getRegistration()
              : undefined;
          if (registration) {
            await registration.showNotification(message.title, {
              body: message.body,
              icon: "/baky-logo.png",
              badge: "/baky-logo.png",
              tag: `loyalty-order-${orderId}-${nextStatus.toLowerCase()}`,
              data: { url: "/customer" },
            });
          } else {
            new Notification(message.title, {
              body: message.body,
              tag: `loyalty-order-${orderId}`,
            });
          }
        } catch (notificationError) {
          console.warn("Could not show the customer order notification", notificationError);
        }
      })();
    };

    const refreshOrderStatuses = async () => {
      try {
        const latest = await getLoyaltyCustomer(phone);
        if (!active || !latest) return;
        latest.orders.forEach((order) => announceStatus(order.id, order.status));
        setProfile(latest);
      } catch (refreshError) {
        console.warn("Could not refresh customer order notifications", refreshError);
      }
    };

    const channel = supabase
      ?.channel(`customer-order-updates-${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "loyalty_orders",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const order = payload.new as { id?: string; status?: string };
          if (order.id && order.status) announceStatus(order.id, order.status);
          void refreshOrderStatuses();
        },
      )
      .subscribe();

    const poll = window.setInterval(() => void refreshOrderStatuses(), 10000);
    return () => {
      active = false;
      window.clearInterval(poll);
      if (channel) void supabase?.removeChannel(channel);
    };
  }, [activeCustomerId, identified, phone]);

  const categories = useMemo(
    () => ["All", ...new Set(menu.map((item) => item.categoryName).filter(Boolean))],
    [menu],
  );
  const shownItems = useMemo(
    () =>
      menu.filter((item) => selectedCategory === "All" || item.categoryName === selectedCategory),
    [menu, selectedCategory],
  );
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const itemSubtotal = cart.reduce((sum, line) => sum + line.item.price * line.qty, 0);
  const takeawayFee = fulfillmentType === "Takeaway" && cart.length > 0 ? 10 : 0;
  const cartTotal = itemSubtotal + takeawayFee;
  const balance = profile?.customer.points_balance || 0;
  const spendRemainder = Number(profile?.customer.spend_remainder || 0);
  const rupeesToNextPoint = Math.max(0, Math.ceil(100 - spendRemainder));
  const rewardsReady = Math.floor(balance / 10);
  const progress = balance % 10;

  const identify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = normalizeLoyaltyPhone(phone);
    if (name.trim().length < 2 || digits.length !== 10) {
      setError("Enter your name and a valid mobile number to continue.");
      return;
    }
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch (permissionError) {
        console.warn("Could not request customer notification permission", permissionError);
      }
    }
    setIsLoading(true);
    setError("");
    try {
      const current = await getLoyaltyCustomer(digits);
      setPhone(digits);
      if (current) setName(current.customer.name);
      setProfile(current);
      setIdentified(true);
      if (!isAppInstalled && !localStorage.getItem(CUSTOMER_INSTALL_DISMISSED_KEY)) {
        setShowInstallDialog(true);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not look up your loyalty card.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const installCustomerApp = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (choice.outcome === "accepted") setIsAppInstalled(true);
      setShowInstallDialog(false);
      localStorage.setItem(CUSTOMER_INSTALL_DISMISSED_KEY, "true");
    } catch (installError) {
      console.warn("Could not start customer app installation", installError);
      setError(
        "Could not open the install prompt. Use your browser menu to add Baky to your home screen.",
      );
    }
  };

  const dismissInstallDialog = () => {
    setShowInstallDialog(false);
    localStorage.setItem(CUSTOMER_INSTALL_DISMISSED_KEY, "true");
  };

  const refreshProfile = async () => {
    if (!phone) return;
    const current = await getLoyaltyCustomer(phone);
    setProfile(current);
  };

  const addItem = (item: LoyaltyMenuItem) => {
    const variant = variants[item.id] || "";
    if (item.variants.length && !variant) {
      setError(`Choose a ${item.name} option first.`);
      return;
    }
    setError("");
    setCart((current) => {
      const found = current.find((line) => line.item.id === item.id && line.variant === variant);
      if (found) {
        return current.map((line) =>
          line === found ? { ...line, qty: Math.min(20, line.qty + 1) } : line,
        );
      }
      return [...current, { item, variant, qty: 1 }];
    });
  };

  const changeQuantity = (itemId: string, variant: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.item.id === itemId && line.variant === variant
            ? { ...line, qty: line.qty + delta }
            : line,
        )
        .filter((line) => line.qty > 0),
    );
  };

  const placeOrder = async () => {
    if (!cart.length || !fulfillmentType) return;
    setIsSubmitting(true);
    setError("");
    try {
      const id = await submitLoyaltyOrder(
        name,
        profile?.customer.phone || phone,
        cart.map((line) => ({
          itemId: line.item.id,
          qty: line.qty,
          variant: line.variant || undefined,
        })),
        fulfillmentType,
      );
      setOrderNumber(id);
      setCart([]);
      setFulfillmentType("");
      setFulfillmentDialogOpen(false);
      setMobileCartOpen(false);
      setView("rewards");
      setNotice("Your order was sent to the shop. Staff will verify with you before preparing it.");
      await refreshProfile();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send your order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const chooseOrderType = () => {
    if (!cart.length) return;
    setMobileCartOpen(false);
    setFulfillmentType("");
    setFulfillmentDialogOpen(true);
  };

  const requestBrownie = async () => {
    setIsSubmitting(true);
    setError("");
    setNotice("");
    try {
      const claimId = await claimFreeBrownie(profile?.customer.phone || phone);
      setNotice(
        `Free brownie claim ${claimId.slice(0, 8).toUpperCase()} requested. Show this to staff to redeem.`,
      );
      await refreshProfile();
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Could not request your reward.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!identified) {
    return (
      <main className="min-h-dvh bg-[#fbfaf8] px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-md">
          <BrandHeader outletName={outletInfo.name} />
          <section className="mt-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c5e9a3]/40 text-[#254a1d]">
              <Award className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-[#171717]">Order & earn rewards</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Enter your details to order from the shop and view your loyalty points.
            </p>
            <form className="mt-6 space-y-4" onSubmit={identify}>
              <label className="block text-sm font-semibold text-gray-800">
                Your name
                <input
                  required
                  minLength={2}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-[#5b9138] focus:ring-2 focus:ring-[#c5e9a3]/60"
                />
              </label>
              <p className="text-xs leading-relaxed text-gray-500">
                Allow notifications when prompted to get updates when your order is confirmed and
                ready.
              </p>
              <label className="block text-sm font-semibold text-gray-800">
                Mobile number
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="10-digit mobile number"
                  className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-[#5b9138] focus:ring-2 focus:ring-[#c5e9a3]/60"
                />
              </label>
              {error && <ErrorNote>{error}</ErrorNote>}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#213a20] px-4 text-sm font-bold text-white transition hover:bg-[#31572e] disabled:opacity-60"
              >
                {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {isLoading ? "Loading your card..." : "Continue"}
                {!isLoading && <ChevronRight className="h-4 w-4" />}
              </button>
            </form>
            <div className="mt-5 rounded-xl bg-[#f5f8f1] p-3 text-xs leading-relaxed text-gray-600">
              <strong className="text-gray-900">Baky Rewards:</strong> Earn 1 point for every ₹100
              spent. Redeem 10 points for one free brownie.
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#fbfaf8] px-3 py-4 pb-28 sm:px-6 sm:py-8 sm:pb-28 lg:pb-8">
      <Dialog
        open={showInstallDialog}
        onOpenChange={(open) => {
          if (!open) dismissInstallDialog();
          else setShowInstallDialog(true);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] overflow-y-auto rounded-3xl border-0 bg-white p-5 sm:max-w-md sm:p-7">
          <DialogHeader className="text-left">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5e6] text-[#31572e]">
              <Award className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-gray-900">
              Keep your points close
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-gray-600">
              Add Baky Dessert House to your phone to check your points and rewards anytime, even
              when you don’t have the QR code nearby.
            </DialogDescription>
          </DialogHeader>

          {!installPrompt && (
            <div className="rounded-2xl bg-[#f5f8f1] p-4 text-sm leading-relaxed text-gray-700">
              {isIosDevice ? (
                <>
                  Tap <strong>Share</strong> in your browser, then choose{" "}
                  <strong>Add to Home Screen</strong>.
                </>
              ) : (
                <>
                  Open your browser menu <strong>⋮</strong> and choose <strong>Install app</strong>{" "}
                  or <strong>Add to Home screen</strong>.
                </>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={dismissInstallDialog}
              className="flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {installPrompt ? "Maybe later" : "Got it"}
            </button>
            {installPrompt && (
              <button
                type="button"
                onClick={() => void installCustomerApp()}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#213a20] px-4 text-sm font-bold text-white hover:bg-[#31572e]"
              >
                Install app
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BrandHeader outletName={outletInfo.name} compact />
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            <UserRound className="h-4 w-4 text-[#527e36]" />
            <span className="max-w-36 truncate">{name}</span>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3720] via-[#2a4b28] to-[#567b3e] p-5 text-white shadow-md sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                Baky Rewards Card
              </p>
              <p className="mt-2 text-4xl font-extrabold sm:text-5xl">
                {balance} <span className="text-base font-semibold text-white/75">points</span>
              </p>
              <p className="mt-2 text-sm text-white/80">
                {rewardsReady > 0
                  ? `${rewardsReady} free brownie ${rewardsReady === 1 ? "reward" : "rewards"} ready`
                  : `${10 - progress} more ${10 - progress === 1 ? "point" : "points"} to a free brownie`}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#d7f5b8]">
                Spend {money(rupeesToNextPoint)} more to earn your next point
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-[#d7f5b8]">
              <Gift className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-[11px] text-white/75">
              <span>Progress to next brownie</span>
              <span>{progress}/10</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-[#c5e9a3] transition-all"
                style={{ width: `${progress * 10}%` }}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-sm">
          <button
            onClick={() => setView("order")}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold ${view === "order" ? "bg-[#213a20] text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <ShoppingBag className="h-4 w-4" /> Order
          </button>
          <button
            onClick={() => {
              setView("rewards");
              void refreshProfile();
            }}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold ${view === "rewards" ? "bg-[#213a20] text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <Award className="h-4 w-4" /> My rewards
          </button>
        </div>

        {notice && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{notice}</p>
            <button
              onClick={() => setNotice("")}
              className="ml-auto text-emerald-800"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}

        {view === "order" ? (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 rounded-2xl border border-black/5 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-extrabold text-gray-900 sm:text-xl">
                    Choose your treats
                  </h1>
                  <p className="mt-1 text-xs text-gray-500">
                    You earn 1 point for every ₹100 spent.
                  </p>
                </div>
                <button
                  onClick={() =>
                    void loadLoyaltyMenu()
                      .then(setMenu)
                      .catch((e) => setError(e.message))
                  }
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Refresh menu"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              {categories.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${selectedCategory === category ? "bg-[#213a20] text-white" : "bg-gray-100 text-gray-700"}`}
                    >
                      {category === "All" ? "All items" : category}
                    </button>
                  ))}
                </div>
              )}
              {menu.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Menu is loading or currently unavailable.
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {shownItems.map((item) => {
                    const count = cart
                      .filter((line) => line.item.id === item.id)
                      .reduce((sum, line) => sum + line.qty, 0);
                    return (
                      <article
                        key={item.id}
                        className="flex min-w-0 flex-col rounded-2xl border border-gray-100 bg-[#fdfdfc] p-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="break-words text-sm font-bold text-gray-900">
                              {item.name}
                            </h2>
                            <p className="mt-1 text-sm font-extrabold text-[#31572e]">
                              {money(item.price)}
                            </p>
                          </div>
                          {count > 0 && (
                            <span className="rounded-full bg-[#eaf4e1] px-2 py-1 text-[10px] font-bold text-[#31572e]">
                              {count} in order
                            </span>
                          )}
                        </div>
                        {item.variants.length > 0 && (
                          <label className="mt-3 text-[11px] font-semibold text-gray-600">
                            Choose option
                            <select
                              value={variants[item.id] || ""}
                              onChange={(event) =>
                                setVariants((current) => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))
                              }
                              className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-900"
                            >
                              <option value="">Select an option</option>
                              {item.variants.map((variant) => (
                                <option key={variant} value={variant}>
                                  {variant}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <button
                          onClick={() => addItem(item)}
                          className="mt-3 flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#bdd9a7] bg-white text-xs font-bold text-[#31572e] hover:bg-[#f2f8ec]"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add item
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="sticky top-3 hidden h-fit rounded-2xl border border-black/5 bg-white p-4 sm:p-5 lg:block">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-gray-900">Your order</h2>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">
                  {cartCount} items
                </span>
              </div>
              {cart.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Add items to start your order.
                </div>
              ) : (
                <div className="mt-3 max-h-72 space-y-3 overflow-y-auto">
                  {cart.map((line) => (
                    <div
                      key={`${line.item.id}:${line.variant}`}
                      className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-900">
                          {line.item.name}
                        </p>
                        {line.variant && (
                          <p className="text-[10px] text-gray-500">{line.variant}</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {money(line.item.price * line.qty)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => changeQuantity(line.item.id, line.variant, -1)}
                          aria-label="Remove one"
                          className="text-gray-500"
                        >
                          <CircleMinus className="h-5 w-5" />
                        </button>
                        <span className="w-4 text-center text-xs font-bold">{line.qty}</span>
                        <button
                          onClick={() => changeQuantity(line.item.id, line.variant, 1)}
                          aria-label="Add one"
                          className="text-[#31572e]"
                        >
                          <CirclePlus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Items subtotal</span>
                  <span className="font-semibold text-gray-900">{money(itemSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-gray-700">Order total</span>
                  <span className="text-lg font-extrabold text-gray-900">
                    {money(itemSubtotal)}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                You’ll choose dine in or takeaway next. Takeaway adds ₹10.
              </p>
              <button
                onClick={chooseOrderType}
                disabled={!cart.length || isSubmitting}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#213a20] px-4 text-sm font-bold text-white hover:bg-[#31572e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" /> Continue to order
              </button>
            </aside>
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Your rewards</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    One free brownie for every 10 points.
                  </p>
                </div>
                <button
                  onClick={() => void refreshProfile()}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Refresh rewards"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 rounded-2xl bg-[#f5f8f1] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Brownie rewards available
                  </span>
                  <span className="text-2xl font-extrabold text-[#31572e]">{rewardsReady}</span>
                </div>
                <button
                  onClick={() => void requestBrownie()}
                  disabled={rewardsReady < 1 || isSubmitting}
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#31572e] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Gift className="h-4 w-4" />{" "}
                  {isSubmitting ? "Requesting..." : "Request a free brownie"}
                </button>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                  Your points are deducted when you request the reward. Show the pending claim to
                  staff to collect it.
                </p>
              </div>
              <h3 className="mt-5 text-sm font-bold text-gray-900">Reward claims</h3>
              {profile?.claims.length ? (
                <ul className="mt-2 divide-y divide-gray-100">
                  {profile.claims.map((claim) => (
                    <li
                      key={claim.id}
                      className="flex items-center justify-between gap-3 py-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">{claim.reward_name}</p>
                        <p className="mt-1 text-[10px] text-gray-500">
                          {claim.status === "Redeemed" && claim.redeemed_at
                            ? `Redeemed ${new Date(claim.redeemed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
                            : `Requested ${new Date(claim.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 font-bold ${claim.status === "Redeemed" ? "bg-emerald-100 text-emerald-800" : claim.status === "Pending" ? "bg-amber-100 text-amber-900" : "bg-gray-100 text-gray-600"}`}
                      >
                        {claim.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-gray-500">No reward claims yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-extrabold text-gray-900">Recent orders</h2>
              <p className="mt-1 text-xs text-gray-500">
                Order status and points awarded by the shop.
              </p>
              {orderNumber && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Your order #
                  {orderNumber.slice(0, 8).toUpperCase()} was received.
                </div>
              )}
              {profile?.orders.length ? (
                <ul className="mt-3 space-y-2">
                  {profile.orders.map((order) => (
                    <li key={order.id} className="rounded-xl border border-gray-100 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          Order {order.shop_order_id || `#${order.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${order.status === "Completed" ? "bg-emerald-100 text-emerald-800" : order.status === "Cancelled" ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-800"}`}
                        >
                          {order.status === "Ready" ? "Served" : order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {new Date(order.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-gray-600">
                        {order.fulfillment_type === "Takeaway" ? "Takeaway" : "Dine in"}
                        {Number(order.takeaway_fee) > 0
                          ? ` · ${money(Number(order.takeaway_fee))} takeaway charge`
                          : ""}
                      </p>
                      {Array.isArray(order.items) && order.items.length > 0 && (
                        <ul className="mt-2 space-y-1 rounded-lg bg-gray-50 px-2.5 py-2">
                          {order.items.map((item, index) => (
                            <li
                              key={`${item.itemId}-${item.variant || ""}-${index}`}
                              className="flex justify-between gap-3 text-[11px] text-gray-700"
                            >
                              <span className="min-w-0 truncate">
                                {item.name}
                                {item.variant ? ` · ${item.variant}` : ""} ×{item.qty}
                              </span>
                              <span className="shrink-0 font-semibold">
                                {money(item.price * item.qty)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-700">
                          {money(Number(order.total))}
                        </span>
                        <span className="font-bold text-[#31572e]">
                          +{order.points_earned || 0} points
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-500">
                  No loyalty orders yet. Start an order to see it here.
                </p>
              )}
            </div>
          </section>
        )}
        <p className="flex items-center justify-center gap-1.5 py-2 text-[11px] text-gray-500">
          <Clock3 className="h-3.5 w-3.5" /> Staff will confirm your order at the shop.
        </p>
      </div>

      {view === "order" && cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <button
            onClick={() => setMobileCartOpen(true)}
            className="mx-auto flex min-h-12 w-full max-w-2xl items-center justify-between rounded-xl bg-[#213a20] px-4 text-left text-white"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm font-bold">Your order · {cartCount} items</span>
            </span>
            <span className="ml-3 shrink-0 text-sm font-extrabold">
              {money(itemSubtotal)} · Review
            </span>
          </button>
        </div>
      )}

      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-0 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:hidden"
        >
          <SheetHeader className="mb-4 pr-8 text-left">
            <SheetTitle className="text-xl font-extrabold text-gray-900">Your order</SheetTitle>
            <SheetDescription>
              {cartCount} items · Review quantities before sending
            </SheetDescription>
          </SheetHeader>
          {cart.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
              Add items to start your order.
            </p>
          ) : (
            <div className="space-y-3">
              {cart.map((line) => (
                <div
                  key={`mobile:${line.item.id}:${line.variant}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{line.item.name}</p>
                    {line.variant && <p className="mt-0.5 text-xs text-gray-500">{line.variant}</p>}
                    <p className="mt-1 text-xs text-gray-600">
                      {money(line.item.price * line.qty)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      onClick={() => changeQuantity(line.item.id, line.variant, -1)}
                      aria-label={`Remove one ${line.item.name}`}
                      className="text-gray-500"
                    >
                      <CircleMinus className="h-6 w-6" />
                    </button>
                    <span className="w-4 text-center text-sm font-bold">{line.qty}</span>
                    <button
                      onClick={() => changeQuantity(line.item.id, line.variant, 1)}
                      aria-label={`Add one ${line.item.name}`}
                      className="text-[#31572e]"
                    >
                      <CirclePlus className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm font-semibold text-gray-600">Items subtotal</span>
            <span className="text-lg font-extrabold text-gray-900">{money(itemSubtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Takeaway adds ₹10 at the next step.</p>
          <button
            onClick={chooseOrderType}
            disabled={!cart.length || isSubmitting}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#213a20] px-4 text-sm font-bold text-white hover:bg-[#31572e] disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" /> Continue to order
          </button>
        </SheetContent>
      </Sheet>

      <Dialog open={fulfillmentDialogOpen} onOpenChange={setFulfillmentDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-3xl border-0 p-5 shadow-2xl duration-300 data-[state=open]:slide-in-from-bottom-3 sm:p-6">
          <DialogHeader className="pr-7 text-left">
            <DialogTitle className="text-xl font-extrabold text-gray-900">
              How would you like your order?
            </DialogTitle>
            <DialogDescription>
              Select dine in or takeaway before sending your order to the shop.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["Dine In", "Takeaway"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={fulfillmentType === type}
                onClick={() => setFulfillmentType(type)}
                className={`flex min-h-[76px] items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${fulfillmentType === type ? "border-[#31572e] bg-[#f1f7eb] text-[#254a1d] ring-2 ring-[#31572e]/20" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
              >
                <span>
                  <span className="block text-sm font-extrabold">
                    {type === "Dine In" ? "Dine in" : "Takeaway"}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-gray-500">
                    {type === "Dine In"
                      ? "Enjoy your order at the shop"
                      : "Includes ₹10 takeaway charge"}
                  </span>
                </span>
                <span
                  className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${fulfillmentType === type ? "border-[#31572e] bg-[#31572e] text-white" : "border-gray-300"}`}
                  aria-hidden="true"
                >
                  {fulfillmentType === type && <CheckCircle2 className="h-4 w-4" />}
                </span>
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items subtotal</span>
              <span>{money(itemSubtotal)}</span>
            </div>
            {fulfillmentType === "Takeaway" && (
              <div className="mt-2 flex justify-between text-gray-600">
                <span>Takeaway charge</span>
                <span>{money(takeawayFee)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-extrabold text-gray-900">
              <span>Total</span>
              <span>{money(cartTotal)}</span>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            Loyalty points are calculated from the item subtotal. The takeaway charge does not earn
            points.
          </p>
          <button
            onClick={() => void placeOrder()}
            disabled={!fulfillmentType || isSubmitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#213a20] px-4 text-sm font-bold text-white transition hover:bg-[#31572e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            {isSubmitting ? "Sending order..." : "Confirm & send order"}
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function BrandHeader({ outletName, compact = false }: { outletName: string; compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        src="/baky-logo.png"
        alt="Baky Dessert House"
        className={`${compact ? "h-10 w-10" : "h-12 w-12"} rounded-xl object-contain`}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-gray-900 sm:text-base">
          {outletName || "Baky Dessert House"}
        </p>
        <p className="text-[11px] font-medium text-gray-500">Desserts · Orders · Rewards</p>
      </div>
    </div>
  );
}

function ErrorNote({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
    >
      {children}
    </p>
  );
}
