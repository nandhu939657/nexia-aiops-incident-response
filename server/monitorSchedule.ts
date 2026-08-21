export type MonitorFrequency = "minute" | "five-minutes" | "hourly" | "daily";

export function buildMonitorCron(frequency: MonitorFrequency, scheduleTime = "09:00") {
  if (frequency === "minute") return "0 * * * * *";
  if (frequency === "five-minutes") return "0 */5 * * * *";
  if (frequency === "hourly") return "0 0 * * * *";
  const [hour, minute] = scheduleTime.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) throw new Error("Daily check time must use HH:MM in 24-hour format");
  return `0 ${minute} ${hour} * * *`;
}
