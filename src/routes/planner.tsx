import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DAYS, SLOTS, findConflicts, generate, sample, type Course, type Input } from "@/lib/scheduler";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Timetable Planner — CampusWeave" },
      { name: "description", content: "Edit courses and generate a conflict-free weekly timetable with explanations." },
      { property: "og:title", content: "Timetable Planner — CampusWeave" },
      { property: "og:description", content: "Generate a conflict-free weekly timetable with explanations." },
    ],
  }),
  component: Planner,
});

const inputCls = "w-full rounded border bg-background px-2 py-1 text-sm";

function Planner() {
  const [data, setData] = useState<Input>(sample);
  const [result, setResult] = useState(() => generate(sample));
  const [groupId, setGroupId] = useState(sample.groups[0].id);
  const conflicts = useMemo(() => findConflicts(data, result.sessions), [data, result]);
  const name = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name ?? "?";

  const update = (id: string, patch: Partial<Course>) =>
    setData((d) => ({ ...d, courses: d.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const add = () =>
    setData((d) => ({ ...d, courses: [...d.courses, { id: `c${Date.now()}`, name: "New course", teacherId: d.teachers[0].id, groupId: d.groups[0].id, hours: 2, lab: false }] }));
  const remove = (id: string) => setData((d) => ({ ...d, courses: d.courses.filter((c) => c.id !== id) }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-bold">CampusWeave</Link>
        <button onClick={() => setResult(generate(data))} className="rounded-md bg-accent px-5 py-2 font-semibold text-accent-foreground">Generate timetable</button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-2xl font-bold">Courses</h2>
          <div className="space-y-3">
            {data.courses.map((c) => (
              <div key={c.id} className="grid grid-cols-2 gap-2 rounded border p-2">
                <input className={`${inputCls} col-span-2`} value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} />
                <select className={inputCls} value={c.teacherId} onChange={(e) => update(c.id, { teacherId: e.target.value })}>
                  {data.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select className={inputCls} value={c.groupId} onChange={(e) => update(c.id, { groupId: e.target.value })}>
                  {data.groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.size})</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm">Hrs/wk
                  <input type="number" min={1} max={10} className={inputCls} value={c.hours} onChange={(e) => update(c.id, { hours: Number(e.target.value) || 1 })} />
                </label>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={c.lab} onChange={(e) => update(c.id, { lab: e.target.checked })} /> Lab</label>
                  <button onClick={() => remove(c.id)} className="text-destructive">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={add} className="mt-3 w-full rounded border border-dashed py-2 text-sm">+ Add course</button>
          <p className="mt-4 text-xs text-muted-foreground">
            Rooms: {data.rooms.map((r) => `${r.name} (${r.capacity}${r.lab ? ", lab" : ""})`).join(" · ")}<br />
            Blocked: Dr. Mehta Mon 9–11, Dr. Iyer Fri afternoon.
          </p>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {data.groups.map((g) => (
              <button key={g.id} onClick={() => setGroupId(g.id)} className={`rounded-full border px-4 py-1 text-sm ${groupId === g.id ? "bg-primary text-primary-foreground" : "bg-card"}`}>{g.name}</button>
            ))}
            <span className={`ml-auto text-sm font-semibold ${conflicts.length ? "text-destructive" : "text-success"}`}>
              {conflicts.length ? `${conflicts.length} conflicts` : "✓ No clashes"} · {result.sessions.length} classes placed
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted"><th className="p-2" />{DAYS.map((d) => <th key={d} className="p-2">{d}</th>)}</tr></thead>
              <tbody>
                {SLOTS.map((t, s) => (
                  <tr key={t} className="border-t">
                    <td className="p-2 font-medium text-muted-foreground">{t}</td>
                    {DAYS.map((_, d) => {
                      const ses = result.sessions.find((x) => x.day === d && x.slot === s && data.courses.find((c) => c.id === x.courseId)?.groupId === groupId);
                      const c = ses && data.courses.find((c) => c.id === ses.courseId);
                      return (
                        <td key={d} className="h-16 border-l p-1 align-top">
                          {c && ses && (
                            <div className={`h-full rounded p-1.5 ${c.lab ? "bg-accent/30" : "bg-secondary"}`}>
                              <div className="font-semibold leading-tight">{c.name}</div>
                              <div className="text-xs text-muted-foreground">{name(data.teachers, c.teacherId)} · {name(data.rooms, ses.roomId)}</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.unplaced.length > 0 && (
            <div className="mt-6 rounded-lg border border-destructive/40 bg-card p-4">
              <h3 className="text-lg font-bold">Why some classes couldn't be placed</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {result.unplaced.map((u) => {
                  const c = data.courses.find((x) => x.id === u.courseId);
                  return (
                    <li key={u.courseId}>
                      <b>{c?.name}</b> ({name(data.groups, c?.groupId ?? "")}) — {u.missing} hour(s) missing: {u.reasons.join("; ") || "no free slot"}.
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
