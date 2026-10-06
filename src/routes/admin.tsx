import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Bar, Btn, Card, Empty, Field, Modal, Shell, Stat } from "@/components/ui-kit";
import { Results } from "@/components/Results";
import { actions, fmt, newId, type DB, type Election, type ElectionStatus, type Position } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — Ballotglass" },
      { name: "description", content: "Manage elections, voters, candidates and results." },
      { property: "og:title", content: "Admin console — Ballotglass" },
      { property: "og:description", content: "Manage elections, voters, candidates and results." },
    ],
  }),
  component: AdminPage,
});

const tabs = [
  { id: "overview", label: "Overview" }, { id: "elections", label: "Elections" }, { id: "candidates", label: "Candidates" },
  { id: "users", label: "Users" }, { id: "results", label: "Results" }, { id: "audit", label: "Audit" },
];

function AdminPage() {
  const [tab, setTab] = useState("overview");
  return (
    <Shell role="admin" tabs={tabs} tab={tab} onTab={setTab}>
      {(d) => (
        <>
          {tab === "overview" && <Overview d={d} go={setTab} />}
          {tab === "elections" && <Elections d={d} />}
          {tab === "candidates" && <Candidates d={d} />}
          {tab === "users" && <Users d={d} />}
          {tab === "results" && <ResultsTab d={d} />}
          {tab === "audit" && <Audit d={d} />}
        </>
      )}
    </Shell>
  );
}

function turnout(d: DB, e: Election) {
  const voters = d.users.filter((u) => u.role === "voter").length || 1;
  return Math.round((d.votes.filter((v) => v.electionId === e.id).length / voters) * 100);
}

function Overview({ d, go }: { d: DB; go: (t: string) => void }) {
  const live = d.elections.find((e) => e.status === "open") ?? d.elections[0];
  const voters = d.users.filter((u) => u.role === "voter").length;
  const pending = d.candidacies.filter((c) => c.status === "pending").length;
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 864e5).toDateString();
    return { label: new Date(Date.now() - (6 - i) * 864e5).toLocaleDateString(undefined, { weekday: "short" }), n: d.votes.filter((v) => new Date(v.castAt).toDateString() === day).length };
  });
  const max = Math.max(1, ...last7.map((x) => x.n));
  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 p-6 lg:col-span-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="label-cap">{live ? `${live.status} · ${live.title}` : "No elections"}</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-tight">{live ? `${turnout(d, live)}% turnout` : "—"}</p>
            <p className="mt-1 text-[13px] font-medium text-mint">{d.votes.length} ballots cast across all elections</p>
          </div>
          {live && <Badge status={live.status} />}
        </div>
        <div className="mt-8 flex h-44 items-end gap-2">
          {last7.map((x, i) => (
            <div key={i} className={`w-full rounded-full ${i === 6 ? "bg-gradient-to-t from-mint to-cyan" : "bg-gradient-to-t from-primary to-cyan"}`} style={{ height: `${Math.max(8, (x.n / max) * 100)}%` }} title={`${x.n} votes`} />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">{last7.map((x, i) => <span key={i}>{x.label}</span>)}</div>
      </Card>
      <aside className="col-span-12 flex flex-col gap-4 lg:col-span-4">
        <Stat label="Registered voters" value={voters} hint={`${d.users.length} total accounts`} />
        <Stat label="Elections" value={d.elections.length} hint={`${d.elections.filter((e) => e.status === "open").length} open now`} tone="cyan" />
        <Stat label="Pending review" value={pending} hint={pending ? "Candidates waiting" : "All clear"} tone="amber" />
      </aside>
      <Card className="col-span-12 lg:col-span-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Elections</h2>
          <Btn size="sm" onClick={() => go("elections")}>Manage</Btn>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {d.elections.slice(0, 3).map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2"><p className="font-display text-[15px] font-semibold">{e.title}</p><Badge status={e.status} /></div>
              <p className="mt-1 text-[12px] text-muted-foreground">{e.organization}</p>
              <div className="mt-3"><Bar pct={turnout(d, e)} /></div>
              <p className="mt-2 text-[11px] text-muted-foreground">{turnout(d, e)}% · ends {fmt(e.endsAt)}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="col-span-12 lg:col-span-4">
        <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
        <div className="space-y-3">
          {d.audit.slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <div className="size-2 shrink-0 rounded-full bg-cyan" />
              <div className="min-w-0"><p className="truncate text-[13px]">{a.action}</p><p className="text-[11px] text-muted-foreground">{a.actor} · {fmt(a.at)}</p></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const nextActions: Record<ElectionStatus, { to: ElectionStatus; label: string }[]> = {
  draft: [{ to: "open", label: "Open voting" }],
  open: [{ to: "closed", label: "Close voting" }],
  closed: [{ to: "published", label: "Publish results" }, { to: "open", label: "Reopen" }],
  published: [],
};

function Elections({ d }: { d: DB }) {
  const [edit, setEdit] = useState<Election | "new" | null>(null);
  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">All elections</h2>
        <Btn onClick={() => setEdit("new")}>+ New election</Btn>
      </div>
      {d.elections.length === 0 && <Empty>No elections yet. Create your first one.</Empty>}
      <div className="space-y-3">
        {d.elections.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="min-w-[220px] flex-1">
              <div className="flex items-center gap-2"><p className="font-semibold">{e.title}</p><Badge status={e.status} /></div>
              <p className="text-[12px] text-muted-foreground">{e.organization} · {e.positions.length} positions · {d.candidacies.filter((c) => c.electionId === e.id && c.status === "approved").length} candidates · {d.votes.filter((v) => v.electionId === e.id).length} votes</p>
              <p className="text-[11px] text-muted-foreground">{fmt(e.startsAt)} → {fmt(e.endsAt)} · {[e.channels.web && "Web", e.channels.ussd && "USSD"].filter(Boolean).join(" + ")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {nextActions[e.status].map((a) => <Btn key={a.to} size="sm" onClick={() => actions.setStatus(e.id, a.to)}>{a.label}</Btn>)}
              {e.status === "draft" && <Btn size="sm" variant="ghost" onClick={() => setEdit(e)}>Edit</Btn>}
              <Btn size="sm" variant="danger" onClick={() => confirm(`Delete "${e.title}"?`) && actions.deleteElection(e.id)}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>
      {edit && <ElectionForm initial={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
    </Card>
  );
}

function ElectionForm({ initial, onClose }: { initial: Election | null; onClose: () => void }) {
  const [f, setF] = useState({
    title: initial?.title ?? "", organization: initial?.organization ?? "", description: initial?.description ?? "",
    startsAt: initial?.startsAt ?? new Date().toISOString().slice(0, 16), endsAt: initial?.endsAt ?? new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 16),
    channels: initial?.channels ?? { web: true, ussd: true },
  });
  const [positions, setPositions] = useState<Position[]>(initial?.positions ?? [{ id: newId(), title: "President", maxSelections: 1 }]);
  const [err, setErr] = useState("");
  const save = () => {
    if (!f.title.trim()) return setErr("Title is required");
    if (new Date(f.endsAt) <= new Date(f.startsAt)) return setErr("End must be after start");
    if (!positions.length || positions.some((p) => !p.title.trim())) return setErr("Add at least one named position");
    actions.saveElection({ ...f, positions, id: initial?.id });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={initial ? "Edit election" : "New election"}>
      <div className="space-y-4">
        <Field label="Title"><input className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Organization"><input className="field" value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} /></Field>
        <Field label="Description"><textarea rows={2} className="field" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts"><input type="datetime-local" className="field" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></Field>
          <Field label="Ends"><input type="datetime-local" className="field" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></Field>
        </div>
        <div className="flex gap-4 text-[13px]">
          {(["web", "ussd"] as const).map((c) => (
            <label key={c} className="flex items-center gap-2"><input type="checkbox" checked={f.channels[c]} onChange={(e) => setF({ ...f, channels: { ...f.channels, [c]: e.target.checked } })} /> {c.toUpperCase()} voting</label>
          ))}
        </div>
        <div>
          <p className="label-cap mb-2">Positions</p>
          <div className="space-y-2">
            {positions.map((p, i) => (
              <div key={p.id} className="flex gap-2">
                <input className="field" placeholder="Position title" value={p.title} onChange={(e) => setPositions(positions.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <input type="number" min={1} className="field w-24" title="Max selections" value={p.maxSelections} onChange={(e) => setPositions(positions.map((x, j) => (j === i ? { ...x, maxSelections: Math.max(1, +e.target.value) } : x)))} />
                <Btn variant="ghost" onClick={() => setPositions(positions.filter((_, j) => j !== i))}>✕</Btn>
              </div>
            ))}
          </div>
          <Btn variant="soft" size="sm" className="mt-2" onClick={() => setPositions([...positions, { id: newId(), title: "", maxSelections: 1 }])}>+ Add position</Btn>
        </div>
        {err && <p className="text-[13px] text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save}>Save</Btn></div>
      </div>
    </Modal>
  );
}

function Candidates({ d }: { d: DB }) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const list = d.candidacies.filter((c) => filter === "all" || c.status === filter);
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Candidate review</h2>
        <div className="flex gap-1">{(["pending", "approved", "rejected", "all"] as const).map((x) => <Btn key={x} size="sm" variant={filter === x ? "brand" : "ghost"} onClick={() => setFilter(x)} className="capitalize">{x}</Btn>)}</div>
      </div>
      {list.length === 0 && <Empty>Nothing here.</Empty>}
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((c) => {
          const u = d.users.find((x) => x.id === c.userId);
          const e = d.elections.find((x) => x.id === c.electionId);
          const p = e?.positions.find((x) => x.id === c.positionId);
          return (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold">{u?.name}</p><p className="text-[12px] text-muted-foreground">{p?.title} · {e?.title}</p></div>
                <Badge status={c.status} />
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">"{c.manifesto}"</p>
              {c.note && <p className="mt-2 text-[12px] text-amber">Note: {c.note}</p>}
              <div className="mt-4 flex gap-2">
                {c.status !== "approved" && <Btn size="sm" onClick={() => actions.reviewCandidacy(c.id, "approved")}>Approve</Btn>}
                {c.status !== "rejected" && <Btn size="sm" variant="danger" onClick={() => { const n = prompt("Reason for rejection (optional)") ?? undefined; actions.reviewCandidacy(c.id, "rejected", n); }}>Reject</Btn>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Users({ d }: { d: DB }) {
  const [q, setQ] = useState("");
  const list = d.users.filter((u) => (u.name + u.email + u.phone + u.role).toLowerCase().includes(q.toLowerCase()));
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Users ({d.users.length})</h2>
        <input className="field max-w-xs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead><tr className="label-cap text-left"><th className="pb-3">Name</th><th className="pb-3">Email</th><th className="pb-3">Phone</th><th className="pb-3">Role</th><th className="pb-3">Votes</th><th /></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="py-3 font-medium">{u.name}</td><td className="text-muted-foreground">{u.email}</td><td className="text-muted-foreground">{u.phone}</td>
                <td className="capitalize">{u.role}</td><td>{d.votes.filter((v) => v.voterId === u.id).length}</td>
                <td className="text-right">{u.role !== "admin" && <Btn size="sm" variant="danger" onClick={() => confirm(`Remove ${u.name}?`) && actions.deleteUser(u.id)}>Remove</Btn>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ResultsTab({ d }: { d: DB }) {
  const [id, setId] = useState(d.elections[0]?.id ?? "");
  const e = d.elections.find((x) => x.id === id);
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Live count</h2><p className="text-[12px] text-muted-foreground">Admins see counts in real time. Voters see results only after publishing.</p></div>
        <select className="field max-w-xs" value={id} onChange={(x) => setId(x.target.value)}>{d.elections.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
      </Card>
      {e ? <Results d={d} e={e} /> : <Empty>No elections.</Empty>}
    </div>
  );
}

function Audit({ d }: { d: DB }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Audit log</h2>
      <div className="space-y-2">
        {d.audit.map((a) => (
          <div key={a.id} className="flex flex-wrap justify-between gap-2 border-b border-border py-2 text-[13px]">
            <span>{a.action}</span><span className="text-muted-foreground">{a.actor} · {fmt(a.at)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
