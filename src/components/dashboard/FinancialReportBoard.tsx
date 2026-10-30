import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  Download,
  FileImage,
  FileText,
  Globe2,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useStore, type Order } from "@/lib/store";
import { toast } from "sonner";

const money = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;
const monthLabel = (month: number) =>
  new Date(2024, month, 1).toLocaleString("en-IN", { month: "short" });
const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

async function getReportLogoDataUrl() {
  const response = await fetch("/baky-logo.png");
  if (!response.ok) throw new Error("Could not load the Baky logo.");
  const logo = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not prepare the Baky logo for export."));
    reader.readAsDataURL(logo);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load an image for the report."));
    image.src = source;
  });
}

function canvasToJpg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not create the JPG image in this browser.")),
      "image/jpeg",
      0.98,
    );
  });
}

function createReportCanvas(width: number, height: number) {
  // Render at up to 3x so report text remains crisp, with a pixel cap for mobile memory.
  const scale = Math.min(3, Math.sqrt(18_000_000 / (width * height)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export isn't available in this browser.");
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return { canvas, context };
}

function orderPayment(order: Order): { cash: number; gpay: number; online: number; paid: number } {
  if (order.status !== "Past Orders" || order.paymentMethod === "Nil") {
    return { cash: 0, gpay: 0, online: 0, paid: 0 };
  }
  if (order.paymentMethod === "Split Payment") {
    const cash = Number(
      order.paymentDetails?.match(/Cash:\s*₹?([\d,.]+)/i)?.[1]?.replaceAll(",", "") ?? 0,
    );
    const gpay = Number(
      order.paymentDetails?.match(/GPay:\s*₹?([\d,.]+)/i)?.[1]?.replaceAll(",", "") ?? 0,
    );
    return { cash, gpay, online: 0, paid: cash + gpay };
  }
  if (order.paymentMethod === "Cash")
    return { cash: order.total, gpay: 0, online: 0, paid: order.total };
  if (order.paymentMethod === "GPay")
    return { cash: 0, gpay: order.total, online: 0, paid: order.total };
  if (order.paymentMethod === "Online Orders")
    return { cash: 0, gpay: 0, online: order.total, paid: order.total };
  return { cash: 0, gpay: 0, online: 0, paid: 0 };
}

function recordDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function FinancialReportBoard() {
  const { orders, expenses } = useStore();
  const [dailyDate, setDailyDate] = useState(() => localDateKey(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const availableYears = useMemo(() => {
    const years = [
      ...orders.map((order) => recordDate(order.createdAt)?.getFullYear()),
      ...expenses.map((expense) => recordDate(expense.date)?.getFullYear()),
    ].filter((year): year is number => year != null);
    return [...new Set([...years, new Date().getFullYear()])].sort((a, b) => b - a);
  }, [orders, expenses]);
  const [year, setYear] = useState(new Date().getFullYear());

  const report = useMemo(() => {
    const monthly = Array.from({ length: 12 }, (_, month) => ({
      month,
      cash: 0,
      gpay: 0,
      online: 0,
      revenue: 0,
      expenses: 0,
      orders: 0,
    }));
    for (const order of orders) {
      const date = recordDate(order.createdAt);
      if (!date || date.getFullYear() !== year) continue;
      const payment = orderPayment(order);
      const row = monthly[date.getMonth()];
      row.cash += payment.cash;
      row.gpay += payment.gpay;
      row.online += payment.online;
      row.revenue += payment.paid;
      if (payment.paid > 0) row.orders += 1;
    }
    for (const expense of expenses) {
      const date = recordDate(expense.date);
      if (date && date.getFullYear() === year) monthly[date.getMonth()].expenses += expense.amount;
    }
    return monthly;
  }, [orders, expenses, year]);

  const totals = report.reduce(
    (all, month) => ({
      cash: all.cash + month.cash,
      gpay: all.gpay + month.gpay,
      online: all.online + month.online,
      revenue: all.revenue + month.revenue,
      expenses: all.expenses + month.expenses,
      orders: all.orders + month.orders,
    }),
    { cash: 0, gpay: 0, online: 0, revenue: 0, expenses: 0, orders: 0 },
  );
  const net = totals.revenue - totals.expenses;
  const maxBar = Math.max(1, ...report.map((month) => month.revenue));
  const lifetime = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + orderPayment(order).paid, 0);
    const payments = orders.reduce(
      (sum, order) => {
        const payment = orderPayment(order);
        return {
          cash: sum.cash + payment.cash,
          gpay: sum.gpay + payment.gpay,
          online: sum.online + payment.online,
        };
      },
      { cash: 0, gpay: 0, online: 0 },
    );
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return { revenue, expenses: expenseTotal, net: revenue - expenseTotal, payments };
  }, [orders, expenses]);
  const monthlyExpenseCategories = useMemo(() => {
    const totals = new Map<string, number>();
    for (const expense of expenses) {
      const date = recordDate(expense.date);
      if (!date || date.getFullYear() !== year || date.getMonth() !== selectedMonth) continue;
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses, year, selectedMonth]);
  const monthlyStats = report[selectedMonth];

  const history = useMemo(() => {
    const days = new Map<
      string,
      {
        revenue: number;
        expenses: number;
        payments: { cash: number; gpay: number; online: number };
        orders: number;
        units: number;
      }
    >();
    const getDay = (date: string) =>
      days.get(date) ?? {
        revenue: 0,
        expenses: 0,
        payments: { cash: 0, gpay: 0, online: 0 },
        orders: 0,
        units: 0,
      };
    for (const order of orders) {
      const date = recordDate(order.createdAt);
      if (!date || date.getFullYear() !== year || date.getMonth() !== selectedMonth) continue;
      const payment = orderPayment(order);
      if (!payment.paid) continue;
      const key = localDateKey(date);
      const day = getDay(key);
      day.revenue += payment.paid;
      day.payments.cash += payment.cash;
      day.payments.gpay += payment.gpay;
      day.payments.online += payment.online;
      day.orders += 1;
      day.units += order.lines.reduce((sum, line) => sum + line.qty, 0);
      days.set(key, day);
    }
    for (const expense of expenses) {
      if (!expense.date.startsWith(`${year}-${String(selectedMonth + 1).padStart(2, "0")}-`))
        continue;
      const day = getDay(expense.date);
      day.expenses += expense.amount;
      days.set(expense.date, day);
    }
    return [...days.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [orders, expenses, year, selectedMonth]);

  const dailyReport = useMemo(() => {
    const dailyOrders = orders
      .filter((order) => {
        const date = recordDate(order.createdAt);
        return date && localDateKey(date) === dailyDate && orderPayment(order).paid > 0;
      })
      .sort(
        (a, b) =>
          (recordDate(a.createdAt)?.getTime() ?? 0) - (recordDate(b.createdAt)?.getTime() ?? 0),
      );
    const dailyExpenses = expenses.filter((expense) => expense.date === dailyDate);
    const payments = { cash: 0, gpay: 0, online: 0 };
    for (const order of dailyOrders) {
      const payment = orderPayment(order);
      payments.cash += payment.cash;
      payments.gpay += payment.gpay;
      payments.online += payment.online;
    }
    const revenue = dailyOrders.reduce((sum, order) => sum + orderPayment(order).paid, 0);
    const expenseTotal = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return {
      orders: dailyOrders,
      expenses: dailyExpenses,
      payments,
      revenue,
      expenseTotal,
      net: revenue - expenseTotal,
      itemCount: dailyOrders.reduce(
        (sum, order) => sum + order.lines.reduce((orderSum, line) => orderSum + line.qty, 0),
        0,
      ),
    };
  }, [orders, expenses, dailyDate]);

  const selectedDateLabel = new Date(`${dailyDate}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const downloadJpg = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.position = "fixed";
    link.style.left = "-10000px";
    link.style.top = "0";
    document.body.appendChild(link);

    try {
      link.click();
    } finally {
      link.remove();
      // Mobile browsers may finish starting the download after the click returns.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  };

  const exportDailyJpg = async () => {
    const width = 1200;
    const padding = 64;
    let rowY = 590;
    for (const order of dailyReport.orders) rowY += 42 + order.lines.length * 36;
    const expenseTop = Math.max(rowY + 96, 690);
    const height = Math.max(880, expenseTop + dailyReport.expenses.length * 45 + 160);
    const { canvas, context } = createReportCanvas(width, height);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#f5f1f8";
    context.fillRect(0, 0, width, 250);
    context.fillStyle = "#795789";
    context.fillRect(padding, 48, 6, 128);
    const logo = await loadImage(await getReportLogoDataUrl());
    context.drawImage(logo, padding + 20, 52, 92, 92);
    context.textBaseline = "alphabetic";
    context.fillStyle = "#171717";
    context.font = "700 24px Arial, sans-serif";
    context.fillText("Baky Dessert House", padding + 128, 76);
    context.font = "700 42px Arial, sans-serif";
    context.fillText("Daily sales report", padding + 128, 133);
    context.fillStyle = "#686868";
    context.font = "23px Arial, sans-serif";
    context.fillText(
      `${selectedDateLabel} · ${dailyReport.orders.length} paid orders`,
      padding + 128,
      180,
    );

    const metricCards = [
      {
        x: 64,
        width: 330,
        fill: "#f8f8f8",
        label: "TOTAL SALES",
        value: dailyReport.revenue,
        color: "#171717",
      },
      {
        x: 418,
        width: 330,
        fill: "#fff5f5",
        label: "TOTAL EXPENSES",
        value: dailyReport.expenseTotal,
        color: "#be123c",
      },
      {
        x: 772,
        width: 364,
        fill: "#f0f8f3",
        label: "NET PROFIT",
        value: dailyReport.net,
        color: dailyReport.net < 0 ? "#be123c" : "#047857",
      },
    ];
    for (const card of metricCards) {
      context.fillStyle = card.fill;
      context.fillRect(card.x, 270, card.width, 112);
      context.fillStyle = "#686868";
      context.font = "17px Arial, sans-serif";
      context.fillText(card.label, card.x + 24, 310);
      context.fillStyle = card.color;
      context.font = "700 34px Arial, sans-serif";
      context.fillText(money(card.value), card.x + 24, 355);
    }

    context.fillStyle = "#242424";
    context.font = "700 20px Arial, sans-serif";
    context.fillText("Payment breakdown", padding, 430);
    const paymentColumns = [
      { x: padding, amountX: 340, label: "Cash received", value: dailyReport.payments.cash },
      { x: 440, amountX: 748, label: "GPay / UPI", value: dailyReport.payments.gpay },
      { x: 790, amountX: 1136, label: "Online orders", value: dailyReport.payments.online },
    ];
    for (const payment of paymentColumns) {
      context.textAlign = "left";
      context.fillStyle = "#686868";
      context.font = "18px Arial, sans-serif";
      context.fillText(payment.label, payment.x, 470);
      context.textAlign = "right";
      context.fillStyle = "#171717";
      context.font = "700 20px Arial, sans-serif";
      context.fillText(money(payment.value), payment.amountX, 470);
    }
    context.textAlign = "left";
    context.fillStyle = "#171717";
    context.font = "700 28px Arial, sans-serif";
    context.fillText(
      `Orders & items (${dailyReport.orders.length} orders · ${dailyReport.itemCount} units)`,
      padding,
      530,
    );
    context.fillStyle = "#686868";
    context.font = "17px Arial, sans-serif";
    context.fillText("ITEM", padding, 568);
    context.textAlign = "right";
    context.fillText("QTY", 850, 568);
    context.fillText("SALES", 1136, 568);
    context.strokeStyle = "#dddddd";
    context.beginPath();
    context.moveTo(padding, 582);
    context.lineTo(1136, 582);
    context.stroke();

    rowY = 590;
    if (dailyReport.orders.length) {
      for (const order of dailyReport.orders) {
        rowY += 42;
        context.fillStyle = "#f5f1f8";
        context.fillRect(padding, rowY - 26, 1072, 38);
        context.textAlign = "left";
        context.fillStyle = "#242424";
        context.font = "700 21px Arial, sans-serif";
        context.fillText(`Order ${order.id}`, padding + 16, rowY, 570);
        const time =
          recordDate(order.createdAt)?.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }) ?? "";
        const takeaway = order.paymentDetails?.match(/Takeaway charges:\s*₹?([\d,.]+)/i)?.[1];
        const orderMeta = [
          time,
          order.paymentMethod || "Paid",
          takeaway ? `Takeaway ₹${takeaway}` : "",
        ]
          .filter(Boolean)
          .join(" · ");
        context.textAlign = "right";
        context.fillStyle = "#686868";
        context.font = "17px Arial, sans-serif";
        context.fillText(orderMeta, 710, rowY);
        context.fillStyle = "#171717";
        context.font = "700 21px Arial, sans-serif";
        context.fillText(money(order.total), 1120, rowY);
        for (const line of order.lines) {
          rowY += 36;
          context.textAlign = "left";
          context.fillStyle = "#242424";
          context.font = "19px Arial, sans-serif";
          context.fillText(
            `${line.name}${line.variant ? ` · ${line.variant}` : ""}`,
            padding + 24,
            rowY,
            730,
          );
          context.textAlign = "right";
          context.fillText(String(line.qty), 850, rowY);
          context.fillText(money(line.price * line.qty), 1120, rowY);
        }
      }
    } else {
      context.fillStyle = "#686868";
      context.font = "22px Arial, sans-serif";
      context.fillText("No paid orders recorded for this day.", padding, 630);
    }

    context.textAlign = "left";
    context.fillStyle = "#171717";
    context.font = "700 28px Arial, sans-serif";
    context.fillText(`Expenses (${dailyReport.expenses.length})`, padding, expenseTop);
    context.strokeStyle = "#dddddd";
    context.beginPath();
    context.moveTo(padding, expenseTop + 12);
    context.lineTo(1136, expenseTop + 12);
    context.stroke();
    if (dailyReport.expenses.length) {
      dailyReport.expenses.forEach((expense, index) => {
        const y = expenseTop + 52 + index * 45;
        context.textAlign = "left";
        context.fillStyle = "#242424";
        context.font = "22px Arial, sans-serif";
        context.fillText(
          `${expense.title} · ${expense.category} · Paid by ${expense.paymentMethod || "Cash"}${expense.notes ? ` · ${expense.notes}` : ""}`,
          padding,
          y,
          900,
        );
        context.textAlign = "right";
        context.fillText(money(expense.amount), 1136, y);
      });
    } else {
      context.fillStyle = "#686868";
      context.font = "22px Arial, sans-serif";
      context.fillText("No expenses recorded for this day.", padding, expenseTop + 52);
    }

    await downloadJpg(await canvasToJpg(canvas), `baky-daily-sales-${dailyDate}.jpg`);
  };

  const printDailyPdf = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      window.alert("Allow pop-ups to print or save this report as a PDF.");
      return;
    }
    const orderRows = dailyReport.orders
      .map((order) => {
        const time = recordDate(order.createdAt)?.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const takeaway = order.paymentDetails?.match(/Takeaway charges:\s*₹?([\d,.]+)/i)?.[1];
        const lines = order.lines
          .map(
            (line) =>
              `<tr><td>${escapeXml(line.name)}${line.variant ? `<small>${escapeXml(line.variant)}</small>` : ""}</td><td class="number">${line.qty}</td><td class="number">${escapeXml(money(line.price * line.qty))}</td></tr>`,
          )
          .join("");
        const meta = [time, order.paymentMethod || "Paid", takeaway ? `Takeaway ₹${takeaway}` : ""]
          .filter(Boolean)
          .map((value) => escapeXml(value))
          .join(" · ");
        return `<tr class="order-heading"><td colspan="3"><div><strong>Order ${escapeXml(order.id)}</strong><span>${meta}</span><b>${escapeXml(money(order.total))}</b></div></td></tr>${lines}`;
      })
      .join("");
    const expenseRows = dailyReport.expenses
      .map(
        (expense) =>
          `<tr><td>${escapeXml(expense.title)}<small>${escapeXml(expense.category)} · Paid by ${escapeXml(expense.paymentMethod || "Cash")}${expense.notes ? ` · ${escapeXml(expense.notes)}` : ""}</small></td><td class="number">${escapeXml(money(expense.amount))}</td></tr>`,
      )
      .join("");
    printWindow.document
      .write(`<!doctype html><html><head><meta charset="utf-8"><title>Daily Sales Report - ${escapeXml(dailyDate)}</title><style>
      @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#171717;margin:0;font-size:12px}header{display:flex;align-items:center;gap:16px;background:#f5f1f8;color:#171717;padding:20px 24px;border-radius:12px;border-left:5px solid #795789}header img{width:64px;height:64px;object-fit:contain;flex:0 0 auto}header small{color:#795789;letter-spacing:1px;font-weight:bold}h1{font-size:27px;margin:8px 0 6px}header p{color:#686868;margin:0}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}.metric{background:#f6f6f6;border-radius:9px;padding:14px}.metric span{display:block;color:#686868;font-size:10px;text-transform:uppercase}.metric strong{display:block;margin-top:7px;font-size:20px}.payments{background:#fafafa;border-radius:8px;padding:12px;display:flex;justify-content:space-between;margin-bottom:22px}h2{font-size:17px;margin:20px 0 8px}table{width:100%;border-collapse:collapse}th{text-align:left;color:#686868;text-transform:uppercase;font-size:9px;letter-spacing:.5px;padding:8px;border-bottom:1px solid #ddd}td{padding:9px 8px;border-bottom:1px solid #eee;vertical-align:top}.number{text-align:right;white-space:nowrap}.order-heading td{background:#f5f1f8;border-top:1px solid #e8deef}.order-heading div{display:flex;align-items:center;justify-content:space-between;gap:8px}.order-heading span{color:#686868;font-size:10px}small{display:block;color:#686868;margin-top:3px}.note{color:#686868;font-size:10px;margin-top:18px}@media print{header,.metric,.payments,.order-heading td{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body><header><img src="/baky-logo.png" alt="Baky logo"><div><small>Baky Dessert House</small><h1>Daily sales report</h1><p>${escapeXml(selectedDateLabel)} · ${dailyReport.orders.length} paid orders</p></div></header><div class="metrics"><div class="metric"><span>Total sales</span><strong>${escapeXml(money(dailyReport.revenue))}</strong></div><div class="metric"><span>Total expenses</span><strong>${escapeXml(money(dailyReport.expenseTotal))}</strong></div><div class="metric"><span>Net profit</span><strong>${escapeXml(money(dailyReport.net))}</strong></div></div><div class="payments"><span>Cash received <b>${escapeXml(money(dailyReport.payments.cash))}</b></span><span>GPay / UPI <b>${escapeXml(money(dailyReport.payments.gpay))}</b></span><span>Online orders <b>${escapeXml(money(dailyReport.payments.online))}</b></span></div><h2>Orders & items (${dailyReport.orders.length} orders · ${dailyReport.itemCount} units)</h2><table><thead><tr><th>Item</th><th class="number">Qty</th><th class="number">Sales</th></tr></thead><tbody>${orderRows || `<tr><td colspan="3">No paid orders recorded for this day.</td></tr>`}</tbody></table><h2>Expenses (${dailyReport.expenses.length}) · ${escapeXml(money(dailyReport.expenseTotal))}</h2><table><thead><tr><th>Expense</th><th class="number">Amount</th></tr></thead><tbody>${expenseRows || `<tr><td colspan="2">No expenses recorded for this day.</td></tr>`}</tbody></table><p class="note">Sales include orders marked paid on this order date. Open and unpaid orders are excluded.</p><script>window.addEventListener('load',()=>{window.focus();window.print()})</script></body></html>`);
    printWindow.document.close();
    printWindow.opener = null;
  };

  const shiftMonth = (amount: number) => {
    const next = new Date(year, selectedMonth + amount, 1);
    setYear(next.getFullYear());
    setSelectedMonth(next.getMonth());
    setDailyDate(localDateKey(next));
  };

  const exportMonthlyJpg = async () => {
    const width = 1200;
    const rowHeight = 56;
    const height = 690 + history.length * rowHeight;
    const monthName = new Date(year, selectedMonth, 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
    const { canvas, context } = createReportCanvas(width, height);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#171717";
    context.fillRect(0, 0, width, 240);
    context.fillStyle = "#d8b1e5";
    context.font = "22px Arial, sans-serif";
    context.fillText("Baky Dessert House", 64, 78);
    context.fillStyle = "#ffffff";
    context.font = "700 42px Arial, sans-serif";
    context.fillText("Monthly financial report", 64, 137);
    context.fillStyle = "#dddddd";
    context.font = "24px Arial, sans-serif";
    context.fillText(monthName, 64, 184);

    const metrics = [
      { x: 64, label: "REVENUE", value: monthlyStats.revenue },
      { x: 440, label: "EXPENSES", value: monthlyStats.expenses },
      { x: 790, label: "NET PROFIT", value: monthlyStats.revenue - monthlyStats.expenses },
    ];
    for (const metric of metrics) {
      context.fillStyle = "#686868";
      context.font = "18px Arial, sans-serif";
      context.fillText(metric.label, metric.x, 300);
      context.fillStyle = "#171717";
      context.font = "700 34px Arial, sans-serif";
      context.fillText(money(metric.value), metric.x, 345);
    }
    context.fillStyle = "#171717";
    context.font = "700 26px Arial, sans-serif";
    context.fillText("Daily history", 64, 430);
    context.fillStyle = "#686868";
    context.font = "16px Arial, sans-serif";
    context.fillText("DATE", 64, 490);
    context.fillText("REVENUE", 380, 490);
    context.fillText("EXPENSES", 690, 490);
    context.textAlign = "right";
    context.fillText("NET", 1136, 490);
    context.strokeStyle = "#dddddd";
    context.beginPath();
    context.moveTo(64, 508);
    context.lineTo(1136, 508);
    context.stroke();
    if (history.length) {
      history.forEach(([date, day], index) => {
        const y = 650 + index * rowHeight;
        const dayLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
        context.textAlign = "left";
        context.fillStyle = "#242424";
        context.font = "23px Arial, sans-serif";
        context.fillText(dayLabel, 64, y);
        context.fillText(money(day.revenue), 380, y);
        context.fillText(money(day.expenses), 690, y);
        context.textAlign = "right";
        context.fillStyle = day.revenue - day.expenses < 0 ? "#be123c" : "#047857";
        context.font = "700 23px Arial, sans-serif";
        context.fillText(money(day.revenue - day.expenses), 1136, y);
      });
    } else {
      context.textAlign = "left";
      context.fillStyle = "#686868";
      context.font = "22px Arial, sans-serif";
      context.fillText("No sales or expenses recorded for this month.", 64, 560);
    }
    await downloadJpg(
      await canvasToJpg(canvas),
      `baky-monthly-report-${year}-${String(selectedMonth + 1).padStart(2, "0")}.jpg`,
    );
  };

  const printMonthlyPdf = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      window.alert("Allow pop-ups to print or save this report as a PDF.");
      return;
    }
    const monthName = new Date(year, selectedMonth, 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
    const rows = history
      .map(
        ([date, day]) =>
          `<tr><td>${new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td><td class="number">${escapeXml(money(day.revenue))}</td><td class="number">${escapeXml(money(day.expenses))}</td><td class="number">${escapeXml(money(day.revenue - day.expenses))}</td></tr>`,
      )
      .join("");
    printWindow.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Monthly Financial Report - ${escapeXml(monthName)}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#171717;font-size:12px;margin:0}header{padding:24px;background:#171717;color:white;border-radius:10px}header small{color:#795789;font-weight:bold}h1{margin:12px 0 4px;font-size:26px}header p{margin:0;color:#ddd}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}.metric{background:#f5f5f5;padding:14px;border-radius:8px}.metric span{display:block;color:#686868;font-size:10px;text-transform:uppercase}.metric strong{display:block;font-size:20px;margin-top:6px}h2{font-size:17px;margin:24px 0 8px}table{width:100%;border-collapse:collapse}th{text-align:left;color:#686868;text-transform:uppercase;font-size:9px;padding:8px;border-bottom:1px solid #ddd}td{padding:9px 8px;border-bottom:1px solid #eee}.number{text-align:right} .note{margin-top:20px;color:#686868;font-size:10px}</style></head><body><header><small>Baky Dessert House</small><h1>Monthly financial report</h1><p>${escapeXml(monthName)}</p></header><div class="metrics"><div class="metric"><span>Revenue</span><strong>${escapeXml(money(monthlyStats.revenue))}</strong></div><div class="metric"><span>Expenses</span><strong>${escapeXml(money(monthlyStats.expenses))}</strong></div><div class="metric"><span>Net profit</span><strong>${escapeXml(money(monthlyStats.revenue - monthlyStats.expenses))}</strong></div></div><h2>Daily history</h2><table><thead><tr><th>Date</th><th class="number">Revenue</th><th class="number">Expenses</th><th class="number">Net</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No sales or expenses recorded for this month.</td></tr>`}</tbody></table><p class="note">Revenue includes paid orders only. Open and unpaid orders are excluded.</p><script>window.addEventListener('load',()=>{window.focus();window.print()})</script></body></html>`,
    );
    printWindow.document.close();
    printWindow.opener = null;
  };

  const exportCsv = () => {
    const rows = [
      [
        "Month",
        "Paid orders",
        "Cash",
        "GPay / UPI",
        "Online orders",
        "Total revenue",
        "Expenses",
        "Net balance",
      ],
      ...report.map((month) => [
        monthLabel(month.month),
        String(month.orders),
        String(month.cash),
        String(month.gpay),
        String(month.online),
        String(month.revenue),
        String(month.expenses),
        String(month.revenue - month.expenses),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `baky-financial-report-${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    {
      label: "Cash received",
      amount: totals.cash,
      icon: Banknote,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "GPay / UPI",
      amount: totals.gpay,
      icon: Smartphone,
      tone: "text-blue-700 bg-blue-50",
    },
    {
      label: "Online orders",
      amount: totals.online,
      icon: Globe2,
      tone: "text-violet-700 bg-violet-50",
    },
    {
      label: "Total expenses",
      amount: totals.expenses,
      icon: ArrowDownRight,
      tone: "text-rose-700 bg-rose-50",
    },
  ];

  const monthTitle = new Date(year, selectedMonth, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 text-black sm:space-y-6">
      <header className="px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#795789]">
          Baky Dessert House
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Financial Reports</h2>
        <p className="mt-1 text-sm text-black/50">Comprehensive performance overview</p>
      </header>

      <section className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-[#f4f4f4] to-[#fafafa] p-4 shadow-sm sm:p-6 lg:p-7">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ChartNoAxesCombined className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Lifetime sales
          </span>
        </div>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/50">
          Total revenue
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-700 sm:text-4xl">
          {money(lifetime.revenue)}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-black/10 pt-4">
          {[
            { label: "Cash", value: lifetime.payments.cash },
            { label: "GPay", value: lifetime.payments.gpay },
            { label: "Online", value: lifetime.payments.online },
          ].map((payment) => (
            <div key={payment.label} className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-black/50">
                {payment.label}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-black sm:text-base">
                {money(payment.value)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-400/10 text-rose-700">
            <ArrowDownRight className="h-4 w-4" />
          </span>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-black/50">
            Total expenses
          </p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">{money(lifetime.expenses)}</p>
          <div className="mt-3 space-y-1 text-[10px] text-black/50">
            <p>Selected month: {money(monthlyStats.expenses)}</p>
            <p>
              {monthlyExpenseCategories
                .slice(0, 2)
                .map(([category, amount]) => `${category}: ${money(amount)}`)
                .join(" · ") || "No monthly expenses"}
            </p>
          </div>
        </article>
        <article className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-400/10 text-rose-700">
            <Wallet className="h-4 w-4" />
          </span>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-black/50">
            Net balance
          </p>
          <p
            className={`mt-1 text-xl font-bold sm:text-2xl ${lifetime.net < 0 ? "text-rose-700" : "text-emerald-700"}`}
          >
            {money(lifetime.net)}
          </p>
          <p className="mt-3 text-[10px] text-black/50">
            Lifetime paid revenue minus recorded expenses
          </p>
        </article>
      </section>

      <section className="rounded-[24px] border border-black/5 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/50">
                Monthly summary
              </p>
              <h3 className="mt-1 text-lg font-bold sm:text-xl">{monthTitle}</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-black/50 hover:bg-black/5"
              >
                ‹
              </button>
              <button
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-black/50 hover:bg-black/5"
              >
                ›
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                void exportMonthlyJpg().catch((error: unknown) => {
                  console.error("Monthly JPG export failed", error);
                  toast.error(
                    error instanceof Error ? error.message : "Could not export the JPG report.",
                  );
                })
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/10 px-2.5 text-[10px] font-medium text-black/50 hover:bg-black/5"
            >
              <FileImage className="h-3.5 w-3.5" /> JPG
            </button>
            <button
              onClick={printMonthlyPdf}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/10 px-2.5 text-[10px] font-medium text-black/50 hover:bg-black/5"
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200 px-2.5 text-[10px] font-medium text-amber-800 hover:bg-amber-100/5"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        </div>

        <div className="mt-6 border-b border-black/5 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-black/50">
            Monthly revenue
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {money(monthlyStats.revenue)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-black/50">Expenses</p>
              <p className="mt-1 text-lg font-semibold">{money(monthlyStats.expenses)}</p>
              <div className="mt-2 space-y-1">
                {monthlyExpenseCategories.length ? (
                  monthlyExpenseCategories.slice(0, 3).map(([category, amount]) => (
                    <p
                      key={category}
                      className="flex items-center gap-2 truncate text-[10px] text-black/50"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#cf9bdf]" />
                      {category}: {money(amount)}
                    </p>
                  ))
                ) : (
                  <p className="text-[10px] text-black/50">No expenses recorded</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-black/50">Net profit</p>
              <p
                className={`mt-1 text-lg font-bold ${monthlyStats.revenue - monthlyStats.expenses < 0 ? "text-rose-700" : "text-blue-700"}`}
              >
                {money(monthlyStats.revenue - monthlyStats.expenses)}
              </p>
              <p className="mt-2 text-[10px] text-black/50">{monthlyStats.orders} paid orders</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() =>
              toast.info(
                "GST is not stored with orders yet, so a reliable GST report cannot be calculated. Add tax tracking to orders first.",
              )
            }
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            <FileText className="h-4 w-4" /> GST report PDF
          </button>
          <button
            onClick={() =>
              toast.info(
                "Demo GST report needs approved sample tax rates. Your actual order data will not be changed.",
              )
            }
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            <FileText className="h-4 w-4" /> Demo GST report PDF
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-black/50" />
            <h3 className="font-bold">
              History: {new Date(year, selectedMonth, 1).toLocaleString("en-IN", { month: "long" })}
            </h3>
          </div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-black/50">
            {history.length} days tracked
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {history.length ? (
            history.map(([date, day]) => {
              const dateObject = new Date(`${date}T12:00:00`);
              const selected = date === dailyDate;
              const profit = day.revenue - day.expenses;
              return (
                <button
                  key={date}
                  onClick={() => setDailyDate(date)}
                  className={`grid grid-cols-[3.2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border p-3 text-left transition ${selected ? "border-[#c79add]/50 bg-[#f5eefa]" : "border-black/5 bg-white hover:border-black/10"}`}
                >
                  <span className="flex h-12 flex-col items-center justify-center rounded-2xl bg-[#efefef] text-center">
                    <span className="text-[9px] font-semibold uppercase text-black/50">
                      {dateObject.toLocaleString("en-IN", { month: "short" })}
                    </span>
                    <span className="text-base font-bold">{dateObject.getDate()}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      Sales {money(day.revenue)}
                    </span>
                    <span className="mt-1 block truncate text-[10px] text-black/50">
                      ↓ {money(day.expenses)} expenses · {day.units} items · {day.orders} orders
                    </span>
                  </span>
                  <span
                    className={`text-right text-sm font-bold ${profit < 0 ? "text-rose-700" : "text-blue-700"}`}
                  >
                    {profit >= 0 ? "+" : "−"}
                    {money(Math.abs(profit))}
                    <span className="block text-[8px] font-medium uppercase tracking-wider text-black/50">
                      profit
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="rounded-[20px] border border-black/5 bg-white p-5 text-center text-sm text-black/50 sm:col-span-2 xl:col-span-3">
              No sales or expenses recorded for {monthTitle}.
            </div>
          )}
        </div>
      </section>

      <section
        id="daily-sales-report"
        className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-4 border-b border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/baky-logo.png"
              alt="Baky Dessert House logo"
              className="h-11 w-11 shrink-0 object-contain sm:h-14 sm:w-14"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#795789]">
                Baky Dessert House
              </p>
              <h3 className="mt-1 text-lg font-bold sm:text-xl">Daily Sales & Expense Report</h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-baky-muted sm:text-sm">
                <CalendarDays className="h-3.5 w-3.5" /> {selectedDateLabel}
              </p>
            </div>
          </div>
          <div className="daily-report-actions flex flex-wrap items-center gap-2">
            <label className="flex h-9 items-center gap-2 rounded-xl border border-black/10 bg-[#fafafa] px-3 text-xs">
              <CalendarDays className="h-4 w-4 text-black/50" />
              <span className="sr-only">Report date</span>
              <input
                aria-label="Daily report date"
                type="date"
                value={dailyDate}
                onChange={(event) => {
                  if (event.target.value) {
                    setDailyDate(event.target.value);
                    const date = new Date(`${event.target.value}T12:00:00`);
                    setYear(date.getFullYear());
                    setSelectedMonth(date.getMonth());
                  }
                }}
                className="min-w-0 bg-transparent text-black outline-none"
              />
            </label>
            <button
              onClick={() =>
                void exportDailyJpg().catch((error: unknown) => {
                  console.error("Daily JPG export failed", error);
                  toast.error(
                    error instanceof Error ? error.message : "Could not export the JPG report.",
                  );
                })
              }
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-black/10 px-3 text-xs font-semibold text-black/50 hover:bg-black/5"
            >
              <FileImage className="h-4 w-4" /> JPG
            </button>
            <button
              onClick={printDailyPdf}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#cf9bdf] px-3 text-xs font-semibold text-[#21172a] hover:bg-[#ddb7e8]"
            >
              <FileText className="h-4 w-4" /> PDF
            </button>
          </div>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Total sales", value: dailyReport.revenue, color: "text-black" },
              { label: "Expenses", value: dailyReport.expenseTotal, color: "text-rose-700" },
              {
                label: "Net profit",
                value: dailyReport.net,
                color: dailyReport.net < 0 ? "text-rose-700" : "text-emerald-700",
              },
              {
                label: "Paid orders",
                value: dailyReport.orders.length,
                color: "text-black",
                count: true,
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-black/5 bg-[#fafafa] p-3 sm:p-4"
              >
                <p className="text-[9px] font-semibold uppercase tracking-wider text-black/50">
                  {metric.label}
                </p>
                <p className={`mt-1 truncate text-base font-bold sm:text-xl ${metric.color}`}>
                  {metric.count ? metric.value : money(metric.value)}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-black/5 bg-white p-3 sm:p-4">
            <p className="mb-3 text-xs font-bold text-gray-900">Payment breakdown</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] font-medium text-black/50">Cash received</p>
                <p className="mt-1 truncate text-sm font-bold sm:text-base">
                  {money(dailyReport.payments.cash)}
                </p>
              </div>
              <div className="border-x border-black/10">
                <p className="text-[9px] font-medium text-black/50">GPay / UPI</p>
                <p className="mt-1 truncate text-sm font-bold sm:text-base">
                  {money(dailyReport.payments.gpay)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-medium text-black/50">Online orders</p>
                <p className="mt-1 truncate text-sm font-bold sm:text-base">
                  {money(dailyReport.payments.online)}
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h4 className="text-sm font-bold">Orders & items sold</h4>
              <span className="text-[10px] text-black/50">
                {dailyReport.orders.length} orders · {dailyReport.itemCount} units
              </span>
            </div>
            {dailyReport.orders.length ? (
              <div className="space-y-3">
                {dailyReport.orders.map((order) => {
                  const orderTime = recordDate(order.createdAt)?.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const takeaway = order.paymentDetails?.match(
                    /Takeaway charges:\s*₹?([\d,.]+)/i,
                  )?.[1];
                  return (
                    <article
                      key={order.id}
                      className="overflow-hidden rounded-xl border border-black/5 bg-white"
                    >
                      <div className="flex flex-col gap-2 bg-[#f5f1f8] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900">Order {order.id}</p>
                          <p className="mt-0.5 truncate text-[10px] text-baky-muted">
                            {[
                              orderTime,
                              order.paymentMethod || "Paid",
                              takeaway ? `Takeaway ₹${takeaway}` : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-gray-900">
                          {money(order.total)}
                        </p>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_5.5rem] gap-2 border-b border-black/5 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-black/50 sm:grid-cols-[minmax(0,1fr)_4rem_7rem] sm:px-4">
                        <span>Item</span>
                        <span className="text-right">Qty</span>
                        <span className="text-right">Amount</span>
                      </div>
                      <div className="divide-y divide-black/5">
                        {order.lines.map((line, index) => (
                          <div
                            key={`${order.id}-${line.name}-${line.variant ?? ""}-${index}`}
                            className="grid grid-cols-[minmax(0,1fr)_2.5rem_5.5rem] gap-2 px-3 py-2.5 text-xs sm:grid-cols-[minmax(0,1fr)_4rem_7rem] sm:px-4"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{line.name}</span>
                              {line.variant && (
                                <span className="block truncate text-[10px] text-black/50">
                                  {line.variant}
                                </span>
                              )}
                            </span>
                            <span className="text-right">{line.qty}</span>
                            <span className="text-right font-semibold">
                              {money(line.price * line.qty)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="py-5 text-center text-xs text-black/50">
                No paid orders recorded for this day.
              </p>
            )}
          </div>
          <div>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h4 className="text-sm font-bold">Expenses</h4>
              <span className="text-[10px] font-medium text-black/50">
                {dailyReport.expenses.length} entries · {money(dailyReport.expenseTotal)}
              </span>
            </div>
            {dailyReport.expenses.length ? (
              <div className="divide-y divide-black/5 rounded-xl border border-black/5">
                {dailyReport.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between gap-3 px-3 py-3 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{expense.title}</span>
                      <span className="block truncate text-[10px] text-black/50">
                        {expense.category} · Paid by {expense.paymentMethod || "Cash"}
                        {expense.notes ? ` · ${expense.notes}` : ""}
                      </span>
                    </span>
                    <strong className="shrink-0 text-rose-700">{money(expense.amount)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-[#fafafa] py-4 text-center text-xs text-black/50">
                No expenses recorded for this day.
              </p>
            )}
          </div>
          <p className="text-[9px] text-black/50">
            Sales include orders marked paid on this order date. Open and unpaid orders are
            excluded.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="min-w-0 rounded-[22px] border border-black/5 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">Revenue by month · {year}</h3>
              <p className="mt-1 text-[10px] text-black/50">Paid revenue</p>
            </div>
            <span className="text-[10px] text-black/50">{totals.orders} paid orders</span>
          </div>
          <div className="mt-5 grid h-36 grid-cols-6 items-end gap-2 sm:h-44 sm:grid-cols-12 sm:gap-3">
            {report.map((month) => (
              <button
                key={month.month}
                onClick={() => {
                  setSelectedMonth(month.month);
                  setDailyDate(`${year}-${String(month.month + 1).padStart(2, "0")}-01`);
                }}
                className="flex h-full min-w-0 flex-col items-center justify-end gap-2"
              >
                <div className="flex h-full w-full items-end">
                  <div
                    title={`${monthLabel(month.month)}: ${money(month.revenue)}`}
                    className={`w-full rounded-t-md ${month.month === selectedMonth ? "bg-[#cf9bdf]" : month.revenue ? "bg-[#795789]" : "bg-black/5"}`}
                    style={{
                      height: `${Math.max(month.revenue ? 8 : 3, (month.revenue / maxBar) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-black/50">{monthLabel(month.month)}</span>
              </button>
            ))}
          </div>
        </article>
        <article className="overflow-hidden rounded-[22px] border border-black/5 bg-white">
          <div className="p-4 sm:p-5">
            <h3 className="text-sm font-bold">Monthly breakdown · {year}</h3>
            <p className="mt-1 text-[10px] text-black/50">Payments, expenses, and net balance</p>
          </div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full min-w-[590px] text-left text-xs">
              <thead className="sticky top-0 bg-[#f8f8f8] text-[9px] uppercase text-black/50">
                <tr>
                  {["Month", "Cash", "GPay", "Online", "Expenses", "Net"].map((header) => (
                    <th key={header} className="px-3 py-2 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {report.map((month) => (
                  <tr
                    key={month.month}
                    onClick={() => {
                      setSelectedMonth(month.month);
                      setDailyDate(`${year}-${String(month.month + 1).padStart(2, "0")}-01`);
                    }}
                    className={`cursor-pointer ${month.month === selectedMonth ? "bg-[#f5eefa]" : "hover:bg-[#fafafa]"}`}
                  >
                    <td className="px-3 py-2 font-medium">
                      {new Date(year, month.month, 1).toLocaleString("en-IN", { month: "short" })}
                    </td>
                    <td className="px-3 py-2">{money(month.cash)}</td>
                    <td className="px-3 py-2">{money(month.gpay)}</td>
                    <td className="px-3 py-2">{money(month.online)}</td>
                    <td className="px-3 py-2">{money(month.expenses)}</td>
                    <td
                      className={`px-3 py-2 font-semibold ${month.revenue - month.expenses < 0 ? "text-rose-700" : "text-emerald-700"}`}
                    >
                      {money(month.revenue - month.expenses)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
