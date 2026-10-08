import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Card, Empty, Field, Modal, Shell, Stat } from "@/components/ui-kit";
import { Results } from "@/components/Results";
import { actions, fmt, type Candidacy, type DB, type Election, type NomineeProfile, type User } from "@/lib/store";
import { NomineeDetails, NomineeForm, StatusTracker, validateNominee } from "@/components/Nominee";

export const Route = createFileRoute("/candidate")({
  head: () => ({
    meta: [
      { title: "Candidate dashboard — Ballotglass" },
      { name: "description", content: "Apply to elections, manage your manifesto and track your candidacy." },
      { property: "og:title", content: "Candidate dashboard — Ballotglass" },
      { property: "og:description", content: "Apply to elections, manage your manifesto and track your candidacy." },
    ],
  }),
  component: CandidatePage,
});

const tabs = [{ id: "mine", label: "My candidacies" }, { id: "apply", label: "Apply" }, { id: "results", label: "Results" }];

function CandidatePage() {
  const [tab, setTab] = useState("mine");
  return (
    <Shell role="candidate" tabs={tabs} tab={tab} onTab={setTab}>
      {(d, me) => (
        <>
          {tab === "mine" && <Mine d={d} me={me} go={setTab} />}
          {tab === "apply" && <Apply d={d} me={me} done={() => setTab("mine")} />}
          {tab === "results" && <Res d={d} me={me} />}
        </>
      )}
    </Shell>
  );
}

function Mine({ d, me, go }: { d: DB; me: User; go: (t: string) => void }) {
  const mine = d.candidacies.filter((c) => c.userId === me.id);
  const [edit, setEdit] = useState<Candidacy | null>(null);
  const [text, setText] = useState("");
  const [prof, setProf] = useState<NomineeProfile>({});
  const [editErr, setEditErr] = useState("");
  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 p-6 lg:col-span-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your candidacies</h2>
          <Btn size="sm" onClick={() => go("apply")}>+ Apply</Btn>
        </div>
        {mine.length === 0 && <Empty>You haven't applied to any election yet.</Empty>}
        <div className="space-y-3">
          {mine.map((c) => {
            const e = d.elections.find((x) => x.id === c.electionId);
            const p = e?.positions.find((x) => x.id === c.positionId);
            const locked = e?.status !== "draft" && c.status !== "rejected";
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-semibold">{e?.title}</p><p className="text-[12px] text-muted-foreground">{p?.title} · applied {fmt(c.createdAt)} · election {e?.status}</p></div>
                  <Badge status={c.status} />
                </div>
                <div className="mt-4 rounded-lg border border-border bg-background/40 p-3"><StatusTracker c={c} /></div>
                <div className="mt-4"><NomineeDetails c={c} u={me} /></div>
                {c.note && <p className="mt-2 text-[12px] text-amber">Reviewer note: {c.note}</p>}
                {!locked && (
                  <div className="mt-3 flex gap-2">
                    <Btn size="sm" variant="ghost" onClick={() => { setEdit(c); setText(c.manifesto); setProf(c.profile ?? {}); }}>{c.status === "rejected" ? "Fix & resubmit" : "Edit profile"}</Btn>
                    <Btn size="sm" variant="danger" onClick={() => confirm("Withdraw this candidacy?") && actions.withdraw(c.id)}>Withdraw</Btn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      <aside className="col-span-12 flex flex-col gap-4 lg:col-span-4">
        <Stat label="Approved" value={mine.filter((c) => c.status === "approved").length} hint="On the ballot" />
        <Stat label="Pending" value={mine.filter((c) => c.status === "pending").length} hint="Awaiting review" tone="amber" />
        <Stat label="Votes received" value={d.votes.reduce((s, v) => s + Object.values(v.selections).flat().filter((id) => mine.some((c) => c.id === id)).length, 0)} hint="Across all elections" tone="cyan" />
      </aside>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit nominee profile">
        <NomineeForm manifesto={text} setManifesto={setText} profile={prof} setProfile={setProf} />
        <div className="mt-4 flex justify-end gap-2"><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn onClick={() => { const er = validateNominee(text, prof); if (er.length) return setEditErr(er.join("\n")); setEditErr(""); actions.updateManifesto(edit!.id, text, prof); setEdit(null); }}>Save</Btn></div>
        {editErr && <p className="mt-3 whitespace-pre-line text-[13px] text-destructive">{editErr}</p>}
      </Modal>
    </div>
  );
}

function Apply({ d, me, done }: { d: DB; me: User; done: () => void }) {
  const avail = d.elections.filter((e) => (e.status === "draft" || e.status === "open") && !d.candidacies.some((c) => c.electionId === e.id && c.userId === me.id));
  const [e, setE] = useState<Election | null>(null);
  const [pos, setPos] = useState("");
  const [m, setM] = useState("");
  const [prof, setProf] = useState<NomineeProfile>({});
  const [err, setErr] = useState("");
  const submit = () => {
    if (!pos) return setErr("Pick a position.");
    const errs = validateNominee(m, prof);
    if (errs.length) return setErr(errs.join("\n"));
    try { actions.apply(e!.id, pos, m.trim(), prof); setE(null); done(); } catch (x) { setErr((x as Error).message); }
  };
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Elections accepting candidates</h2>
      {avail.length === 0 && <Empty>No elections available to apply to right now.</Empty>}
      <div className="grid gap-3 md:grid-cols-3">
        {avail.map((x) => (
          <div key={x.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex justify-between gap-2"><p className="font-display font-semibold">{x.title}</p><Badge status={x.status} /></div>
            <p className="mt-1 text-[12px] text-muted-foreground">{x.organization}</p>
            <p className="mt-2 text-[13px] text-muted-foreground">{x.description}</p>
            <p className="mt-2 text-[12px]">{x.positions.map((p) => p.title).join(" · ")}</p>
            <Btn size="sm" className="mt-4" onClick={() => { setE(x); setPos(x.positions[0]?.id ?? ""); setM(""); setProf({ contactEmail: me.email, contactPhone: me.phone, nomineeType: "individual" }); setErr(""); }}>Apply</Btn>
          </div>
        ))}
      </div>
      <Modal open={!!e} onClose={() => setE(null)} title={`Apply · ${e?.title ?? ""}`}>
        <div className="space-y-4">
          <Field label="Category / position"><select className="field" value={pos} onChange={(x) => setPos(x.target.value)}>{e?.positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
          <NomineeForm manifesto={m} setManifesto={setM} profile={prof} setProfile={setProf} />
          {err && <p className="whitespace-pre-line rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-[13px] text-destructive">{err}</p>}
          <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setE(null)}>Cancel</Btn><Btn onClick={submit}>Submit application</Btn></div>
        </div>
      </Modal>
    </Card>
  );
}

function Res({ d, me }: { d: DB; me: User }) {
  const ids = new Set(d.candidacies.filter((c) => c.userId === me.id).map((c) => c.electionId));
  const pub = d.elections.filter((e) => e.status === "published" && ids.has(e.id));
  if (!pub.length) return <Card><Empty>Results appear here once an election you're in is published.</Empty></Card>;
  return <div className="space-y-6">{pub.map((e) => <div key={e.id} className="space-y-3"><h2 className="text-xl font-semibold">{e.title}</h2><Results d={d} e={e} /></div>)}</div>;
}
