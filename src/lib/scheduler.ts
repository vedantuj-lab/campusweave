export type Room = { id: string; name: string; capacity: number; lab: boolean };
export type Teacher = { id: string; name: string; unavailable: string[] }; // "d-s" keys
export type Group = { id: string; name: string; size: number };
export type Course = { id: string; name: string; teacherId: string; groupId: string; hours: number; lab: boolean };
export type Session = { courseId: string; day: number; slot: number; roomId: string };
export type Unplaced = { courseId: string; missing: number; reasons: string[] };

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];
export const key = (d: number, s: number) => `${d}-${s}`;

export type Input = { rooms: Room[]; teachers: Teacher[]; groups: Group[]; courses: Course[] };

export function generate(inp: Input): { sessions: Session[]; unplaced: Unplaced[] } {
  const sessions: Session[] = [];
  const unplaced: Unplaced[] = [];
  const tBusy = new Set<string>(), gBusy = new Set<string>(), rBusy = new Set<string>();
  const gDay = new Map<string, number>(); // course per day count, spreads load
  // Most constrained first: labs, then more hours
  const order = [...inp.courses].sort((a, b) => Number(b.lab) - Number(a.lab) || b.hours - a.hours);
  for (const c of order) {
    const t = inp.teachers.find((x) => x.id === c.teacherId);
    const g = inp.groups.find((x) => x.id === c.groupId);
    const reasons = new Set<string>();
    if (!t || !g) { unplaced.push({ courseId: c.id, missing: c.hours, reasons: ["Teacher or group missing"] }); continue; }
    const rooms = inp.rooms.filter((r) => r.capacity >= g.size && (!c.lab || r.lab)).sort((a, b) => a.capacity - b.capacity);
    if (!rooms.length) reasons.add(`No ${c.lab ? "lab " : ""}room fits ${g.size} students`);
    let placed = 0;
    const slots: [number, number][] = [];
    for (let d = 0; d < DAYS.length; d++) for (let s = 0; s < SLOTS.length; s++) slots.push([d, s]);
    slots.sort((a, b) => (gDay.get(`${c.id}-${a[0]}`) ?? 0) - (gDay.get(`${c.id}-${b[0]}`) ?? 0));
    for (let pass = 0; pass < c.hours && rooms.length; pass++) {
      slots.sort((a, b) => (gDay.get(`${c.id}-${a[0]}`) ?? 0) - (gDay.get(`${c.id}-${b[0]}`) ?? 0) || a[0] - b[0] || a[1] - b[1]);
      let ok = false;
      for (const [d, s] of slots) {
        const k = key(d, s);
        if (t.unavailable.includes(k)) { reasons.add(`${t.name} unavailable at some slots`); continue; }
        if (tBusy.has(`${t.id}@${k}`)) { reasons.add(`${t.name} already teaching`); continue; }
        if (gBusy.has(`${g.id}@${k}`)) { reasons.add(`${g.name} already in class`); continue; }
        const r = rooms.find((r) => !rBusy.has(`${r.id}@${k}`));
        if (!r) { reasons.add("All suitable rooms occupied"); continue; }
        tBusy.add(`${t.id}@${k}`); gBusy.add(`${g.id}@${k}`); rBusy.add(`${r.id}@${k}`);
        gDay.set(`${c.id}-${d}`, (gDay.get(`${c.id}-${d}`) ?? 0) + 1);
        sessions.push({ courseId: c.id, day: d, slot: s, roomId: r.id });
        placed++; ok = true; break;
      }
      if (!ok) break;
    }
    if (placed < c.hours) unplaced.push({ courseId: c.id, missing: c.hours - placed, reasons: [...reasons] });
  }
  return { sessions, unplaced };
}

/** Independent validator: lists every hard-constraint violation in a timetable. */
export function findConflicts(inp: Input, sessions: Session[]): string[] {
  const out: string[] = [];
  const seen = new Map<string, Session>();
  for (const s of sessions) {
    const c = inp.courses.find((x) => x.id === s.courseId)!;
    const k = key(s.day, s.slot);
    for (const tag of [`t:${c.teacherId}@${k}`, `g:${c.groupId}@${k}`, `r:${s.roomId}@${k}`]) {
      if (seen.has(tag)) out.push(`${tag.split(":")[0] === "t" ? "Teacher" : tag[0] === "g" ? "Group" : "Room"} double-booked on ${DAYS[s.day]} ${SLOTS[s.slot]}`);
      seen.set(tag, s);
    }
  }
  return out;
}

export const sample: Input = {
  rooms: [
    { id: "r1", name: "A-101", capacity: 60, lab: false },
    { id: "r2", name: "A-102", capacity: 40, lab: false },
    { id: "r3", name: "Lab-1", capacity: 35, lab: true },
  ],
  teachers: [
    { id: "t1", name: "Dr. Mehta", unavailable: ["0-0", "0-1"] },
    { id: "t2", name: "Prof. Rao", unavailable: [] },
    { id: "t3", name: "Dr. Iyer", unavailable: ["4-4", "4-5"] },
  ],
  groups: [
    { id: "g1", name: "CS-2A", size: 55 },
    { id: "g2", name: "CS-2B", size: 32 },
  ],
  courses: [
    { id: "c1", name: "Data Structures", teacherId: "t1", groupId: "g1", hours: 4, lab: false },
    { id: "c2", name: "DS Lab", teacherId: "t1", groupId: "g2", hours: 2, lab: true },
    { id: "c3", name: "Discrete Math", teacherId: "t2", groupId: "g1", hours: 3, lab: false },
    { id: "c4", name: "Discrete Math", teacherId: "t2", groupId: "g2", hours: 3, lab: false },
    { id: "c5", name: "DBMS", teacherId: "t3", groupId: "g2", hours: 4, lab: false },
    { id: "c6", name: "DBMS Lab", teacherId: "t3", groupId: "g1", hours: 2, lab: true },
  ],
};
