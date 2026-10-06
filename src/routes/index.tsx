import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/ui-kit";
import { currentUser, dashFor, useDB } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ballotglass — Multi-channel voting platform" },
      { name: "description", content: "Run secure elections over web and USSD with dashboards for admins, voters and candidates." },
      { property: "og:title", content: "Ballotglass — Multi-channel voting platform" },
      { property: "og:description", content: "Run secure elections over web and USSD with dashboards for admins, voters and candidates." },
    ],
  }),
  component: Home,
});

const roles = [
  { t: "Admin", d: "Create elections, review candidates, open and close polls, publish results.", tone: "from-primary to-cyan" },
  { t: "Voter", d: "See eligible elections, cast a sealed ballot, keep your receipt.", tone: "from-cyan to-mint" },
  { t: "Candidate", d: "Apply to elections, write your manifesto, track your review status.", tone: "from-mint to-amber" },
];

function Home() {
  const d = useDB();
  const me = currentUser(d);
  return (
    <div className="min-h-screen bg-stage">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        <header className="glass flex items-center justify-between px-5 py-4">
          <Logo />
          {me ? (
            <Link to={dashFor(me.role)} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-primary-foreground">Open dashboard</Link>
          ) : (
            <Link to="/auth" className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-primary-foreground">Sign in</Link>
          )}
        </header>

        <div className="mt-7 grid grid-cols-12 gap-4">
          <section className="glass col-span-12 p-8 lg:col-span-8 lg:p-12">
            <p className="label-cap">Web · USSD · SMS · Email</p>
            <h1 className="mt-4 max-w-[16ch] text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">One voting engine. Every channel.</h1>
            <p className="mt-5 max-w-[52ch] text-muted-foreground">Ballotglass lets schools, clubs, cooperatives and companies run trustworthy elections — from candidate review to certified results.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="rounded-lg bg-brand px-5 py-2.5 text-[14px] font-semibold text-primary-foreground">Get started</Link>
            </div>
          </section>
          <aside className="col-span-12 flex flex-col gap-4 lg:col-span-4">
            {[["Ballots sealed", "100%", "text-mint"], ["Channels", "Web + USSD", "text-cyan"], ["Roles", "3 dashboards", "text-amber"]].map(([a, b, c]) => (
              <div key={a} className="glass p-5">
                <p className="label-cap">{a}</p>
                <p className={`mt-1 font-display text-3xl font-bold ${c}`}>{b}</p>
              </div>
            ))}
          </aside>
          {roles.map((r) => (
            <section key={r.t} className="glass col-span-12 p-6 md:col-span-4">
              <div className={`mb-4 size-10 rounded-xl bg-gradient-to-br ${r.tone}`} />
              <h2 className="text-lg font-semibold">{r.t}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{r.d}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
