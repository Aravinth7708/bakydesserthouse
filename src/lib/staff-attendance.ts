export const SHIFT_START = "18:30";
export const SHIFT_END = "22:00";
export const DAILY_STAFF_PAY = 150;

export type AttendancePay = {
  lateMinutes: number;
  earlyLeaveMinutes: number;
  deduction: number;
  earned: number;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function calculateAttendancePay(
  checkIn: string,
  checkOut: string,
  dailyPay = DAILY_STAFF_PAY,
): AttendancePay {
  const scheduledStart = timeToMinutes(SHIFT_START);
  const scheduledEnd = timeToMinutes(SHIFT_END);
  const lateMinutes = Math.max(0, timeToMinutes(checkIn) - scheduledStart);
  const earlyLeaveMinutes = Math.max(0, scheduledEnd - timeToMinutes(checkOut));
  const missedMinutes = Math.min(scheduledEnd - scheduledStart, lateMinutes + earlyLeaveMinutes);
  const earned = Math.round(
    Math.max(0, dailyPay - (dailyPay * missedMinutes) / (scheduledEnd - scheduledStart)),
  );
  const deduction = Math.max(0, dailyPay - earned);

  return {
    lateMinutes,
    earlyLeaveMinutes,
    deduction,
    earned,
  };
}

export function formatPay(amount: number) {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatClockTime(value?: string | null) {
  if (!value) return "—";
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
