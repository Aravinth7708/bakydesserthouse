import { useMemo, useState } from "react";
import { CalendarCheck2, CalendarDays, CircleX, Clock3, Timer, WalletCards } from "lucide-react";
import { useStore, type StaffAttendance } from "@/lib/store";
import {
  calculateAttendancePay,
  DAILY_STAFF_PAY,
  formatClockTime,
  formatPay,
  localDateKey,
  SHIFT_END,
  SHIFT_START,
} from "@/lib/staff-attendance";

type AttendanceStatus = "Present" | "Absent" | "Late";

const latePresets = [
  { label: "30 min late", minutes: 30 },
  { label: "1 hr late", minutes: 60 },
  { label: "1.5 hr late", minutes: 90 },
  { label: "2 hr late", minutes: 120 },
];

function timeAfterMinutes(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function attendanceStatus(record: StaffAttendance): AttendanceStatus {
  return (
    record.status ||
    ((record.checkIn && record.checkIn > SHIFT_START) ||
    (record.checkOut && record.checkOut < SHIFT_END)
      ? "Late"
      : "Present")
  );
}

function payForRecord(record: StaffAttendance) {
  const status = attendanceStatus(record);
  if (status === "Present") {
    return { lateMinutes: 0, earlyLeaveMinutes: 0, deduction: 0, earned: record.dailyPay };
  }
  if (status === "Absent") {
    return { lateMinutes: 0, earlyLeaveMinutes: 0, deduction: record.dailyPay, earned: 0 };
  }
  return calculateAttendancePay(
    record.checkIn || SHIFT_START,
    record.checkOut || SHIFT_END,
    record.dailyPay,
  );
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AttendanceBoard() {
  const { attendance, currentUser, markStaffAttendance, staff } = useStore();
  const today = localDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [dialog, setDialog] = useState<{
    staffId: string;
    staffName: string;
    record?: StaffAttendance;
  } | null>(null);
  const visibleStaff = useMemo(
    () =>
      currentUser?.role === "Staff" && currentUser.staffMember
        ? staff.filter((member) => member.id === currentUser.staffMember?.id)
        : staff,
    [currentUser, staff],
  );
  const dayRecords = useMemo(
    () => attendance.filter((record) => record.date === selectedDate),
    [attendance, selectedDate],
  );
  const recordsByStaff = useMemo(
    () => new Map(dayRecords.map((record) => [record.staffId, record])),
    [dayRecords],
  );
  const presentCount = dayRecords.filter((record) => attendanceStatus(record) === "Present").length;
  const absentCount = dayRecords.filter((record) => attendanceStatus(record) === "Absent").length;
  const lateCount = dayRecords.filter((record) => attendanceStatus(record) === "Late").length;
  const totalEarned = dayRecords.reduce((sum, record) => sum + payForRecord(record).earned, 0);
  const totalDeduction = dayRecords.reduce(
    (sum, record) => sum + payForRecord(record).deduction,
    0,
  );
  const monthOptions = useMemo(() => {
    const months = new Set([
      today.slice(0, 7),
      ...attendance.map((record) => record.date.slice(0, 7)),
    ]);
    return [...months].filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [attendance, today]);
  const [historyMonth, setHistoryMonth] = useState(today.slice(0, 7));
  const monthlyRecords = useMemo(
    () =>
      attendance
        .filter(
          (record) =>
            record.date.startsWith(historyMonth) &&
            visibleStaff.some((member) => member.id === record.staffId),
        )
        .sort((a, b) => b.date.localeCompare(a.date) || a.staffName.localeCompare(b.staffName)),
    [attendance, historyMonth, visibleStaff],
  );
  const monthlyEarned = monthlyRecords.reduce(
    (sum, record) => sum + payForRecord(record).earned,
    0,
  );
  const monthlyDeduction = monthlyRecords.reduce(
    (sum, record) => sum + payForRecord(record).deduction,
    0,
  );
  const monthlyStaffTotals = useMemo(
    () =>
      visibleStaff.map((member) => {
        const records = monthlyRecords.filter((record) => record.staffId === member.id);
        return {
          id: member.id,
          name: member.name,
          salary: records.reduce((sum, record) => sum + payForRecord(record).earned, 0),
          recordedDays: records.length,
          absentDays: records.filter((record) => attendanceStatus(record) === "Absent").length,
        };
      }),
    [monthlyRecords, visibleStaff],
  );
  const monthDays = useMemo(() => {
    const grouped = new Map<string, StaffAttendance[]>();
    monthlyRecords.forEach((record) =>
      grouped.set(record.date, [...(grouped.get(record.date) || []), record]),
    );
    return [...grouped.entries()];
  }, [monthlyRecords]);

  const mark = (staffId: string, staffName: string, status: AttendanceStatus) => {
    if (status === "Late") {
      setDialog({ staffId, staffName });
      return;
    }
    void markStaffAttendance(staffId, selectedDate, status);
  };

  const saveDialog = async (status: AttendanceStatus, checkIn?: string, checkOut?: string) => {
    if (!dialog) return;
    await markStaffAttendance(dialog.staffId, selectedDate, status, checkIn, checkOut);
    setDialog(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-6 sm:gap-5">
      <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-baky-muted">
              Baky Dessert House
            </p>
            <h2 className="mt-1 text-xl font-bold text-black sm:text-2xl">Staff Attendance</h2>
            <p className="mt-1 text-sm text-baky-muted">
              Mark each shift and calculate the daily wage.
            </p>
          </div>
          <label className="flex h-11 items-center gap-2 self-start rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-black sm:self-auto">
            <CalendarDays className="h-4 w-4 text-baky-muted" />
            <span className="sr-only">Attendance date</span>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="min-w-0 bg-transparent outline-none"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-white/80 px-3 py-2.5 text-xs text-black/70 sm:text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Clock3 className="h-4 w-4 text-[#1177E5]" />
            Shift {formatClockTime(SHIFT_START)}–{formatClockTime(SHIFT_END)}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <WalletCards className="h-4 w-4 text-emerald-700" />
            {formatPay(DAILY_STAFF_PAY)} per present shift
          </span>
          <span className="text-[11px] text-baky-muted sm:text-xs">
            Late attendance requires in and out times.
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-black/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-black sm:text-lg">
              Monthly attendance & salary
            </h3>
            <p className="mt-1 text-xs text-baky-muted sm:text-sm">
              Review recorded shifts and salary earned for each month.
            </p>
          </div>
          <label className="flex h-10 items-center gap-2 self-start rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-black sm:self-auto">
            <CalendarDays className="h-4 w-4 text-baky-muted" />
            <span className="sr-only">History month</span>
            <select
              value={historyMonth}
              onChange={(event) => setHistoryMonth(event.target.value)}
              className="min-w-0 bg-transparent outline-none"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {new Date(`${month}-15T12:00:00`).toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MonthlyMetric label="Salary earned" value={formatPay(monthlyEarned)} />
          <MonthlyMetric label="Recorded shifts" value={String(monthlyRecords.length)} />
          <MonthlyMetric
            label="Present / late"
            value={String(
              monthlyRecords.filter((record) => attendanceStatus(record) !== "Absent").length,
            )}
          />
          <MonthlyMetric
            label="Absent"
            value={String(
              monthlyRecords.filter((record) => attendanceStatus(record) === "Absent").length,
            )}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 text-xs sm:text-sm">
          <span className="text-baky-muted">Salary reduction from late/early shifts</span>
          <strong className="text-amber-800">{formatPay(monthlyDeduction)}</strong>
        </div>

        <div className="mt-4">
          <h4 className="mb-2 text-sm font-bold text-black">Salary by staff member</h4>
          {monthlyStaffTotals.length === 0 ? (
            <p className="rounded-xl bg-white p-3 text-xs text-baky-muted">
              No staff members are available for this account.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {monthlyStaffTotals.map((member) => (
                <article
                  key={member.id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-3 sm:p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-black">{member.name}</p>
                    <p className="mt-1 text-[11px] text-baky-muted sm:text-xs">
                      {member.recordedDays}{" "}
                      {member.recordedDays === 1 ? "day recorded" : "days recorded"}
                      {member.absentDays > 0 ? ` · ${member.absentDays} absent` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-bold text-emerald-800 sm:text-lg">
                    {formatPay(member.salary)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {monthDays.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/15 bg-white p-5 text-center text-sm text-baky-muted">
              No attendance has been recorded for this month.
            </div>
          ) : (
            monthDays.map(([date, records]) => {
              const dayPay = records.reduce((sum, record) => sum + payForRecord(record).earned, 0);
              return (
                <article
                  key={date}
                  className="rounded-xl border border-black/10 bg-white p-3 sm:p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2">
                    <div>
                      <p className="text-sm font-bold text-black">{dateLabel(date)}</p>
                      <p className="mt-0.5 text-[11px] text-baky-muted">
                        {records.length}{" "}
                        {records.length === 1 ? "recorded shift" : "recorded shifts"}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-800">
                      Day total: {formatPay(dayPay)}
                    </p>
                  </div>
                  <div className="mt-2 divide-y divide-black/5">
                    {records.map((record) => {
                      const pay = payForRecord(record);
                      const status = attendanceStatus(record);
                      return (
                        <div
                          key={record.id}
                          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 text-xs sm:text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-semibold text-black">
                              {record.staffName}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status === "Present" ? "bg-emerald-100 text-emerald-800" : status === "Absent" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900"}`}
                            >
                              {status}
                            </span>
                          </div>
                          <span
                            className={`font-bold ${status === "Absent" ? "text-rose-700" : "text-black"}`}
                          >
                            {formatPay(pay.earned)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label="Present"
          value={`${presentCount} / ${visibleStaff.length}`}
          kind="present"
        />
        <SummaryCard label="Absent" value={String(absentCount)} kind="absent" />
        <SummaryCard label="Late" value={String(lateCount)} kind="late" />
        <SummaryCard
          label="Full-shift payroll"
          value={formatPay(visibleStaff.length * DAILY_STAFF_PAY)}
          kind="pay"
        />
        <SummaryCard label="Calculated wages" value={formatPay(totalEarned)} kind="pay" />
        <SummaryCard label="Wage reduction" value={formatPay(totalDeduction)} kind="deduction" />
      </section>

      <section className="rounded-2xl border border-black/5 bg-baky-surface p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-black/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-black sm:text-lg">
              {selectedDate === today ? "Today’s team" : "Attendance details"}
            </h3>
            <p className="mt-0.5 text-xs text-baky-muted sm:text-sm">{dateLabel(selectedDate)}</p>
          </div>
          <span className="text-xs font-medium text-baky-muted">
            {visibleStaff.length} {visibleStaff.length === 1 ? "staff member" : "staff members"}
          </span>
        </div>

        {visibleStaff.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white p-6 text-center">
            <CalendarCheck2 className="mx-auto h-8 w-8 text-baky-muted" />
            <p className="mt-2 font-semibold text-black">No staff members found</p>
            <p className="mt-1 text-sm text-baky-muted">
              Add staff accounts in Manage to record attendance.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleStaff.map((member) => {
              const record = recordsByStaff.get(member.id);
              return (
                <StaffAttendanceCard
                  key={member.id}
                  staffName={member.name}
                  record={record}
                  onMark={(status) => mark(member.id, member.name, status)}
                  onEdit={() => setDialog({ staffId: member.id, staffName: member.name, record })}
                />
              );
            })}
          </div>
        )}
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-baky-muted sm:text-xs">
        Present earns {formatPay(DAILY_STAFF_PAY)}; absent earns ₹0. Late pay is prorated using the
        210-minute shift and added to expenses when saved.
      </p>

      {dialog && (
        <AttendanceDialog
          key={`${dialog.staffId}-${dialog.record?.id ?? "new"}`}
          staffName={dialog.staffName}
          record={dialog.record}
          dailyPay={dialog.record?.dailyPay ?? DAILY_STAFF_PAY}
          onClose={() => setDialog(null)}
          onSave={saveDialog}
        />
      )}
    </div>
  );
}

function MonthlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="min-w-0 rounded-xl border border-black/5 bg-white p-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-baky-muted sm:text-xs">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-bold text-black sm:text-lg">{value}</p>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind: "present" | "absent" | "late" | "pay" | "deduction";
}) {
  const Icon =
    kind === "present"
      ? CalendarCheck2
      : kind === "absent"
        ? CircleX
        : kind === "late"
          ? Timer
          : WalletCards;
  return (
    <article className="min-w-0 rounded-2xl border border-black/5 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2 text-baky-muted">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate text-[11px] font-semibold sm:text-xs">{label}</span>
      </div>
      <p className="mt-2 truncate text-lg font-bold text-black sm:text-xl">{value}</p>
    </article>
  );
}

function StaffAttendanceCard({
  staffName,
  record,
  onMark,
  onEdit,
}: {
  staffName: string;
  record?: StaffAttendance;
  onMark: (status: AttendanceStatus) => void;
  onEdit: () => void;
}) {
  const status = record ? attendanceStatus(record) : undefined;
  const pay = record ? payForRecord(record) : null;
  const statusClass =
    status === "Present"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Absent"
        ? "bg-rose-100 text-rose-800"
        : status === "Late"
          ? "bg-amber-100 text-amber-900"
          : "bg-gray-100 text-gray-600";

  return (
    <article className="min-w-0 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-bold text-black sm:text-lg">{staffName}</h4>
          <p className="mt-1 text-xs text-baky-muted">
            Daily rate {formatPay(record?.dailyPay ?? DAILY_STAFF_PAY)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs ${statusClass}`}
        >
          {status || "Not marked"}
        </span>
      </div>

      {status === "Late" && record && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-baky-surface/70 p-3">
          <TimeValue label="In time" value={formatClockTime(record.checkIn)} />
          <TimeValue label="Out time" value={formatClockTime(record.checkOut)} />
        </div>
      )}

      {record && pay && (
        <div className="mt-3 space-y-1 text-xs sm:text-sm">
          {status === "Late" && pay.lateMinutes > 0 && (
            <p className="text-amber-800">Late by {pay.lateMinutes} min</p>
          )}
          {status === "Late" && pay.earlyLeaveMinutes > 0 && (
            <p className="text-amber-800">Left early by {pay.earlyLeaveMinutes} min</p>
          )}
          {pay.deduction > 0 && (
            <p className="font-medium text-amber-800">
              Salary reduction: {formatPay(pay.deduction)}
            </p>
          )}
          <p
            className={`pt-1 font-bold ${status === "Absent" ? "text-rose-700" : "text-emerald-800"}`}
          >
            Salary: {formatPay(pay.earned)}
          </p>
        </div>
      )}

      {record ? (
        <button
          type="button"
          onClick={onEdit}
          className="mt-4 min-h-10 w-full rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-black transition hover:bg-baky-surface"
        >
          Edit attendance
        </button>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onMark("Present")}
            className="min-h-10 rounded-xl bg-emerald-600 px-2 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 sm:text-sm"
          >
            Present
          </button>
          <button
            type="button"
            onClick={() => onMark("Absent")}
            className="min-h-10 rounded-xl bg-rose-600 px-2 py-2 text-xs font-bold text-white transition hover:bg-rose-700 sm:text-sm"
          >
            Absent
          </button>
          <button
            type="button"
            onClick={() => onMark("Late")}
            className="min-h-10 rounded-xl bg-amber-500 px-2 py-2 text-xs font-bold text-black transition hover:bg-amber-400 sm:text-sm"
          >
            Late
          </button>
        </div>
      )}
    </article>
  );
}

function AttendanceDialog({
  staffName,
  record,
  dailyPay,
  onClose,
  onSave,
}: {
  staffName: string;
  record?: StaffAttendance;
  dailyPay: number;
  onClose: () => void;
  onSave: (status: AttendanceStatus, checkIn?: string, checkOut?: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<AttendanceStatus>(
    record ? attendanceStatus(record) : "Late",
  );
  const [checkIn, setCheckIn] = useState(record?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(record?.checkOut ?? "");
  const validLateTimes = Boolean(
    checkIn && checkOut && checkOut >= checkIn && (checkIn > SHIFT_START || checkOut < SHIFT_END),
  );
  const estimatedPay =
    status === "Present"
      ? dailyPay
      : status === "Absent"
        ? 0
        : validLateTimes
          ? calculateAttendancePay(checkIn, checkOut, dailyPay).earned
          : null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "Late" && !validLateTimes) return;
    void onSave(
      status,
      status === "Late" ? checkIn : undefined,
      status === "Late" ? checkOut : undefined,
    );
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-black">
              {record ? "Edit attendance" : "Mark attendance"}
            </h3>
            <p className="mt-1 text-sm text-baky-muted">
              {staffName} · {formatPay(dailyPay)} full shift
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-lg text-black/50 hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["Present", "Absent", "Late"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              aria-pressed={status === option}
              className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition sm:text-sm ${
                status === option
                  ? option === "Present"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : option === "Absent"
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-amber-500 bg-amber-400 text-black"
                  : "border-black/10 bg-white text-black hover:bg-baky-surface"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {status === "Late" && (
          <>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-gray-700">Quick late presets</p>
              <div className="grid grid-cols-2 gap-2">
                {latePresets.map((preset) => {
                  const presetInTime = timeAfterMinutes(SHIFT_START, preset.minutes);
                  const selected = checkIn === presetInTime && checkOut === SHIFT_END;
                  return (
                    <button
                      key={preset.minutes}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setCheckIn(presetInTime);
                        setCheckOut(SHIFT_END);
                      }}
                      className={`min-h-10 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                        selected
                          ? "border-amber-500 bg-amber-100 text-amber-950"
                          : "border-black/10 bg-white text-black hover:bg-amber-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-baky-muted">
                Presets set out-time to {formatClockTime(SHIFT_END)}; you can change either time.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-gray-700">
                In time
                <input
                  type="time"
                  required
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-black outline-none focus:border-[#1177E5]"
                />
              </label>
              <label className="text-xs font-semibold text-gray-700">
                Out time
                <input
                  type="time"
                  required
                  min={checkIn || undefined}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-black outline-none focus:border-[#1177E5]"
                />
              </label>
            </div>
          </>
        )}
        {status === "Late" && checkIn && checkOut && checkOut >= checkIn && !validLateTimes && (
          <p className="mt-2 text-xs text-amber-800">
            For Late status, in time must be after {formatClockTime(SHIFT_START)} or out time before{" "}
            {formatClockTime(SHIFT_END)}.
          </p>
        )}

        <div className="mt-4 rounded-xl bg-baky-surface p-3 text-sm">
          <span className="text-baky-muted">Calculated salary</span>
          <strong className="ml-2 text-black">
            {estimatedPay === null ? "Enter both times" : formatPay(estimatedPay)}
          </strong>
        </div>
        {status === "Late" && validLateTimes && (
          <p className="mt-2 text-xs leading-relaxed text-baky-muted">
            Late arrival and early departure are prorated against the {formatClockTime(SHIFT_START)}
            –{formatClockTime(SHIFT_END)} shift.
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-black hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={status === "Late" && !validLateTimes}
            className="min-h-11 flex-1 rounded-xl bg-[#1177E5] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save attendance
          </button>
        </div>
      </form>
    </div>
  );
}

function TimeValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-baky-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-black sm:text-base">{value}</p>
    </div>
  );
}
