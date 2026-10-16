import { describe, it, expect } from "vitest";
import { generate, findConflicts, sample } from "@/lib/scheduler";

describe("scheduler", () => {
  it("produces a timetable with no double bookings", () => {
    const { sessions } = generate(sample);
    expect(findConflicts(sample, sessions)).toEqual([]);
  });
  it("never places a class in a teacher's unavailable slot", () => {
    const { sessions } = generate(sample);
    const bad = sessions.filter((s) => s.courseId === "c1" && s.day === 0 && s.slot < 2);
    expect(bad).toHaveLength(0);
  });
  it("explains when a lab group is too big for every lab", () => {
    const r = generate(sample);
    const u = r.unplaced.find((x) => x.courseId === "c6");
    expect(u?.reasons[0]).toContain("No lab room fits 55");
  });
});
