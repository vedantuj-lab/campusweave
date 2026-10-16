import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusWeave — Conflict-Free College Timetables" },
      { name: "description", content: "Generate, explain and fix college timetables with fewer conflicts." },
      { property: "og:title", content: "CampusWeave — Conflict-Free College Timetables" },
      { property: "og:description", content: "Smarter Scheduling. Fewer Conflicts. Better Campus Experiences." },
    ],
  }),
  component: Index,
});

const features = [
  ["Conflict-free generation", "Teachers, groups and rooms are never double-booked."],
  ["Explainable results", "Every unplaced class comes with the exact reasons why."],
  ["Respects availability", "Blocked teacher hours and room capacity are hard rules."],
];

function Index() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-bold">CampusWeave</span>
        <Link to="/planner" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Open planner</Link>
      </header>
      <section className="weave-bg border-y">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent-foreground/70">Smarter Scheduling. Fewer Conflicts.</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
            Build better campus timetables, <em className="text-accent">with fewer conflicts.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Add your teachers, rooms and courses. CampusWeave weaves them into a clash-free week — and tells you plainly what couldn't fit and why.
          </p>
          <Link to="/planner" className="mt-10 inline-block rounded-md bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-lg">Generate a timetable →</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-3">
        {features.map(([t, d]) => (
          <div key={t} className="rounded-lg border bg-card p-6">
            <h3 className="text-xl font-bold">{t}</h3>
            <p className="mt-2 text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
