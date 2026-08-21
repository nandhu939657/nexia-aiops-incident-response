import { describe, expect, it } from "vitest";
import { buildMonitorCron } from "./monitorSchedule";

describe("monitor schedule expressions", () => {
  it("builds supported recurring intervals", () => {
    expect(buildMonitorCron("minute")).toBe("0 * * * * *");
    expect(buildMonitorCron("five-minutes")).toBe("0 */5 * * * *");
    expect(buildMonitorCron("hourly")).toBe("0 0 * * * *");
  });

  it("builds and validates a daily check time", () => {
    expect(buildMonitorCron("daily", "18:30")).toBe("0 30 18 * * *");
    expect(() => buildMonitorCron("daily", "25:00")).toThrow(/HH:MM/);
  });
});
