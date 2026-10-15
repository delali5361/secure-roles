import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge, Bar, Btn, Card, Empty, Modal, Shell, Stat } from "@/components/ui-kit";
import { Results } from "@/components/Results";
import { Avatar, NomineeDetails, displayName } from "@/components/Nominee";
import { NomineeDiscussion } from "@/components/NomineeDiscussion";
import { ArrowLeft, Columns2 } from "lucide-react";
import { BuyVotes } from "@/components/PaidVote";
import { actions, fmt, ghs, isPaid, type Candidacy, type DB, type Election, type Position, type User, type Vote } from "@/lib/store";
import { ShareLinks, nomineeUrl } from "@/components/ShareLinks";

/** Live countdown to the end of voting. */
function Countdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState(() => new Date(endsAt).getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (left <= 0) return <span className="font-mono text-[12px] text-amber">Closing…</span>;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const txt = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${String(sec).padStart(2, "0")}s`;
  return <span className={`font-mono text-[12px] ${left < 3600e3 ? "text-amber" : "text-mint"}`}>⏱ {txt} left</span>;
}

/** Copies a share link for the election. */
function ShareBtn({ e }: { e: Election }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const share = async () => {
    const text = `Vote in "${e.title}" (${e.organization}) on Ballotglass — closes ${fmt(e.endsAt)}`;
    try {
      if (navigator.share) await navigator.share({ title: e.title, text, url: location.origin });
      else { await navigator.clipboard.writeText(`${text} · ${location.origin}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch (e) { if ((e as Error).name !== "AbortError") setError("Sharing unavailable in this browser."); }
  };
  return <div><Btn size="sm" variant="ghost" onClick={share}>{copied ? "✓ Copied" : "↗ Share"}</Btn>{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}

export const Route = createFileRoute("/voter")({
  head: () => ({
    meta: [
      { title: "Voter dashboard — Ballotglass" },
      { name: "description", content: "See your elections, cast your ballot and keep your receipts." },
      { property: "og:title", content: "Voter dashboard — Ballotglass" },
      { property: "og:description", content: "See your elections, cast your ballot and keep your receipts." },
    ],
  }),
  component: VoterPage,
});

const tabs = [{ id: "home", label: "Elections" }, { id: "receipts", label: "Receipts" }, { id: "results", label: "Results" }, { id: "ussd", label: "USSD" }];

function VoterPage() {
  const [tab, setTab] = useState("home");
  return (
    <Shell role="voter" tabs={tabs} tab={tab} onTab={setTab}>
      {(d, me) => (
        <>
          {tab === "home" && <Home d={d} me={me} />}
          {tab === "receipts" && <Receipts d={d} me={me} />}
          {tab === "results" && <Published d={d} />}
          {tab === "ussd" && <Ussd d={d} me={me} />}
        </>
      )}
    </Shell>
  );
}

function Home({ d, me }: { d: DB; me: User }) {
  const [ballot, setBallot] = useState<Election | null>(null);
  const [receipt, setReceipt] = useState<Vote | null>(null);
  const mine = d.votes.filter((v) => v.voterId === me.id);
  const open = d.elections.filter((e) => e.status === "open");
  const voted = (e: Election) => mine.some((v) => v.electionId === e.id);
  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 p-6 lg:col-span-8">
        <p className="label-cap">Welcome back</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">{me.name.split(" ")[0]}, {open.filter((e) => !voted(e)).length ? "your ballot is waiting." : "you're all caught up."}</h1>
        <div className="mt-6 space-y-3">
          {d.elections.filter((e) => e.status !== "draft").length === 0 && <Empty>No elections available yet.</Empty>}
          {d.elections.filter((e) => e.status !== "draft").map((e) => {
            const ballots = d.votes.filter((v) => v.electionId === e.id).length;
            const nominees = d.candidacies.filter((c) => c.electionId === e.id && c.status === "approved").length;
            return (
              <div key={e.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><p className="font-semibold">{e.title}</p><Badge status={e.status} /></div>
                    <p className="text-[12px] text-muted-foreground">{e.organization} · closes {fmt(e.endsAt)}</p>
                  </div>
                  {e.status === "open" && e.channels.web && !voted(e) && <Btn onClick={() => setBallot(e)}>{e.positions.every(isPaid) ? "Buy votes →" : "Cast ballot →"}</Btn>}
                  {e.status === "open" && e.channels.web && voted(e) && e.positions.some(isPaid) && <Btn variant="soft" onClick={() => setBallot(e)}>Buy more votes →</Btn>}
                  {voted(e) && <span className="text-[13px] font-medium text-mint">✓ Voted</span>}
                  {e.positions.some(isPaid) && <span className="rounded-full border border-amber/40 px-2 py-0.5 text-[11px] text-amber">Paid voting</span>}
                  <ShareBtn e={e} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {e.status === "open" && <Countdown endsAt={e.endsAt} />}
                  <span className="text-[12px] text-muted-foreground">{ballots} ballot{ballots === 1 ? "" : "s"} cast · {nominees} nominee{nominees === 1 ? "" : "s"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <aside className="col-span-12 flex flex-col gap-4 lg:col-span-4">
        <Stat label="Open elections" value={open.length} hint={`${open.filter((e) => !voted(e)).length} awaiting your vote`} />
        <Stat label="Ballots cast" value={mine.length} hint="Receipts saved" tone="cyan" />
        <Stat label="Phone" value={<span className="text-xl">{me.phone}</span>} hint="Used for SMS & USSD" tone="amber" />
      </aside>
      {ballot && <Ballot d={d} e={ballot} me={me} voted={voted(ballot)} onClose={() => setBallot(null)} onDone={(v) => { setBallot(null); setReceipt(v); }} />}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Ballot sealed">
        {receipt && <ReceiptView v={receipt} d={d} />}
      </Modal>
    </div>
  );
}

function Ballot({ d, e, me, voted, onClose, onDone }: { d: DB; e: Election; me: User; voted: boolean; onClose: () => void; onDone: (v: Vote) => void }) {
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState<"pick" | "review">("pick");
  const [err, setErr] = useState("");
  const [buy, setBuy] = useState<{ p: Position; c: Candidacy } | null>(null);
  const [paidMsg, setPaidMsg] = useState("");
  const hasFree = !voted && e.positions.some((p) => !isPaid(p));
  const toggle = (pid: string, cid: string, max: number) => {
    const cur = sel[pid] ?? [];
    const next = cur.includes(cid) ? cur.filter((x) => x !== cid) : max === 1 ? [cid] : cur.length < max ? [...cur, cid] : cur;
    setSel({ ...sel, [pid]: next });
  };
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [compare, setCompare] = useState<Candidacy[] | null>(null);
  const [cmpPos, setCmpPos] = useState<string | null>(null);
  const name = (cid: string) => d.users.find((u) => u.id === d.candidacies.find((c) => c.id === cid)?.userId)?.name;
  const submit = () => { try { onDone(actions.castVote(e.id, sel)); } catch (x) { setErr((x as Error).message); } };
  return (
    <Modal open onClose={onClose} title={e.title}>
      {compare ? <div className="space-y-4"><Btn variant="ghost" size="sm" onClick={() => { setCompare(null); setCmpPos(null); }}><ArrowLeft size={14} /> Back to ballot</Btn><h3 className="font-semibold">Compare · {e.positions.find((p) => p.id === cmpPos)?.title}</h3><div className="grid gap-4 sm:grid-cols-2">{compare.map((c) => <section key={c.id} className="min-w-0 space-y-3 border-t border-border pt-3"><NomineeDetails c={c} u={d.users.find((u) => u.id === c.userId)} /><Btn className="w-full" variant={cmpPos && sel[cmpPos]?.includes(c.id) ? "soft" : "brand"} onClick={() => { const p = e.positions.find((p) => p.id === cmpPos); if (p) toggle(p.id, c.id, p.maxSelections); }}>{cmpPos && sel[cmpPos]?.includes(c.id) ? "Selected ✓" : "Select nominee"}</Btn></section>)}</div></div> : step === "pick" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <Countdown endsAt={e.endsAt} />
            <span className="text-[12px] text-muted-foreground">{d.votes.filter((v) => v.electionId === e.id).length} ballots cast so far</span>
          </div>
          {e.positions.map((p) => {
            const cands = d.candidacies.filter((c) => c.electionId === e.id && c.positionId === p.id && c.status === "approved");
            const paid = isPaid(p);
            if (!paid && voted) return null;
            return (
              <div key={p.id}>
                <div className="mb-2 flex justify-between"><p className="font-semibold">{p.title}</p><span className={`text-[12px] ${paid ? "font-medium text-amber" : "text-muted-foreground"}`}>{paid ? `Paid · ${ghs(p.price ?? 0)} per vote` : `Choose up to ${p.maxSelections}`}</span></div>
                {cands.length > 1 && !paid && <Btn variant="ghost" size="sm" onClick={() => { setCompare(cands); setCmpPos(p.id); }} className="mb-2"><Columns2 size={14} /> Compare {cands.length} nominees</Btn>}
                {cands.length === 0 && <p className="text-[13px] text-muted-foreground">No candidates.</p>}
                <div className="space-y-2">
                  {cands.map((c) => {
                    const on = sel[p.id]?.includes(c.id);
                    const myVotes = (d.payments ?? []).filter((x) => x.candidacyId === c.id && x.voterId === me.id).reduce((s, x) => s + x.quantity, 0);
                    return (
                      <div key={c.id}>{paid ? (
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                          <div className="flex-1"><NomineeDetails c={c} u={d.users.find((u) => u.id === c.userId)} compact />{myVotes > 0 && <p className="mt-1 text-[12px] text-mint">You've bought {myVotes} vote{myVotes === 1 ? "" : "s"}</p>}</div>
                          <Btn size="sm" onClick={() => setBuy({ p, c })}>Buy votes</Btn>
                        </div>
                      ) : <Btn variant="ghost" aria-pressed={!!on} onClick={() => toggle(p.id, c.id, p.maxSelections)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${on ? "border-cyan bg-cyan/10" : "border-border bg-card hover:border-cyan/40"}`}>
                        <span className={`grid size-5 place-items-center rounded-full border ${on ? "border-cyan" : "border-border"}`}>{on && <span className="size-2.5 rounded-full bg-cyan" />}</span>
                        <div className="flex-1"><NomineeDetails c={c} u={d.users.find((u) => u.id === c.userId)} compact /></div>
                      </Btn>}
                      <Btn variant="ghost" size="sm" onClick={() => setOpen({ ...open, [c.id]: !open[c.id] })} className="mt-1">{open[c.id] ? "Hide profile" : "View full profile"}</Btn>{open[c.id] && <div className="mt-3 space-y-3 border-l border-border pl-3"><NomineeDetails c={c} u={d.users.find((u) => u.id === c.userId)} /><ShareLinks url={nomineeUrl(c.id)} text={`Vote for ${c.profile?.stageName ?? d.users.find((u) => u.id === c.userId)?.name} — ${e.title} on Ballotglass`} /><NomineeDiscussion d={d} candidacyId={c.id} /></div>}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {paidMsg && <p className="rounded-lg border border-mint/40 bg-mint/10 p-3 text-[13px] text-mint">{paidMsg}</p>}
          <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>{hasFree ? "Cancel" : "Done"}</Btn>{hasFree && <Btn disabled={!Object.values(sel).some((x) => x.length)} onClick={() => setStep("review")}>Review ballot</Btn>}</div>
          {buy && <BuyVotes e={e} p={buy.p} c={buy.c} me={me} nominee={d.users.find((u) => u.id === buy.c.userId)?.name ?? "nominee"} onClose={() => setBuy(null)} onPaid={(pay) => { setBuy(null); setPaidMsg(`Payment successful · ${pay.quantity} vote${pay.quantity === 1 ? "" : "s"} added · ref ${pay.reference}`); }} />}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] text-muted-foreground">Confirm your choices. Once submitted, your ballot cannot be changed.</p>
          {e.positions.map((p) => (
            <div key={p.id} className="flex justify-between rounded-lg border border-border bg-card p-3 text-[13px]">
              <span className="text-muted-foreground">{p.title}</span><span className="font-medium">{(sel[p.id] ?? []).map(name).join(", ") || "Abstain"}</span>
            </div>
          ))}
          {err && <p className="text-[13px] text-destructive">{err}</p>}
          <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setStep("pick")}>Back</Btn><Btn onClick={submit}>Submit ballot</Btn></div>
        </div>
      )}
    </Modal>
  );
}

function ReceiptView({ v, d }: { v: Vote; d: DB }) {
  const e = d.elections.find((x) => x.id === v.electionId);
  return (
    <div className="space-y-3 text-[13px]">
      {[["Election", e?.title], ["Receipt", v.receipt], ["Cast at", fmt(v.castAt)], ["Channel", v.channel.toUpperCase()], ["Status", "Verified"]].map(([a, b]) => (
        <div key={a} className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">{a}</span><span className={a === "Receipt" || a === "Status" ? "font-mono text-mint" : ""}>{b}</span></div>
      ))}
      <p className="text-[12px] text-muted-foreground">Your receipt proves your ballot was recorded. It does not reveal your choices.</p>
    </div>
  );
}

function Receipts({ d, me }: { d: DB; me: User }) {
  const mine = d.votes.filter((v) => v.voterId === me.id);
  const pays = (d.payments ?? []).filter((x) => x.voterId === me.id);
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">My receipts</h2>
      {mine.length === 0 && pays.length === 0 && <Empty>You haven't voted yet.</Empty>}
      <div className="grid gap-3 md:grid-cols-2">{mine.map((v) => <div key={v.id} className="rounded-xl border border-border bg-card p-4"><ReceiptView v={v} d={d} /></div>)}</div>
      {pays.length > 0 && <><h3 className="mb-3 mt-6 font-semibold">Payments</h3><div className="grid gap-3 md:grid-cols-2">{pays.map((x) => { const e = d.elections.find((y) => y.id === x.electionId); const c = d.candidacies.find((y) => y.id === x.candidacyId); return <div key={x.id} className="rounded-xl border border-border bg-card p-4 text-[13px]"><div className="flex justify-between"><span className="font-mono text-cyan">{x.reference}</span><span className="font-semibold text-mint">{ghs(x.amount)}</span></div><p className="mt-1">{x.quantity} vote{x.quantity === 1 ? "" : "s"} · {d.users.find((u) => u.id === c?.userId)?.name}</p><p className="text-muted-foreground">{e?.title} · {x.method === "momo" ? "Mobile Money" : "Card"} · {fmt(x.paidAt)}</p></div>; })}</div></>}
    </Card>
  );
}

function Published({ d }: { d: DB }) {
  const pub = d.elections.filter((e) => e.status === "published");
  if (!pub.length) return <Card><Empty>No results have been published yet.</Empty></Card>;
  return <div className="space-y-6">{pub.map((e) => <div key={e.id} className="space-y-3"><h2 className="text-xl font-semibold">{e.title}</h2><Results d={d} e={e} /></div>)}</div>;
}

/** Simulated USSD session (*711#) using the same voting engine. */
function Ussd({ d, me }: { d: DB; me: User }) {
  const open = d.elections.filter((e) => e.status === "open" && e.channels.ussd);
  const [screen, setScreen] = useState<{ text: string; handler: (i: string) => void } | null>(null);
  const [input, setInput] = useState("");
  const [lines, setLines] = useState("Dial *711# to start");

  const start = () => {
    const sel: Record<string, string[]> = {};
    const showMenu = () => {
      setLines(`Ballotglass\n${open.map((e, i) => `${i + 1}. ${e.title}`).join("\n") || "No open elections"}\n0. Exit`);
      setScreen({ text: "menu", handler: (i) => { const e = open[+i - 1]; if (!e) return end("Session ended."); askPos(e, 0); } });
    };
    const askPos = (e: Election, idx: number) => {
      if (d.votes.some((v) => v.electionId === e.id && v.voterId === me.id)) return end("You have already voted in this election.");
      const p = e.positions[idx];
      if (!p) {
        try { const v = actions.castVote(e.id, sel, "ussd"); return end(`Vote recorded.\nReceipt: ${v.receipt}`); } catch (x) { return end((x as Error).message); }
      }
      const cands = d.candidacies.filter((c) => c.electionId === e.id && c.positionId === p.id && c.status === "approved");
      setLines(`${p.title}\n${cands.map((c, i) => `${i + 1}. ${d.users.find((u) => u.id === c.userId)?.name}`).join("\n")}\n0. Skip`);
      setScreen({ text: "pos", handler: (i) => { const c = cands[+i - 1]; if (c) sel[p.id] = [c.id]; askPos(e, idx + 1); } });
    };
    showMenu();
  };
  const end = (msg: string) => { setLines(msg); setScreen(null); };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg font-semibold">USSD simulator</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">Try voting the way feature-phone users do. Votes go into the same ballot box.</p>
      </Card>
      <div className="mx-auto w-full max-w-xs rounded-[2.5rem] border border-border bg-card p-4">
        <div className="min-h-56 whitespace-pre-line rounded-2xl bg-background p-4 font-mono text-[13px] text-mint">{lines}</div>
        {screen ? (
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const h = screen.handler; setInput(""); h(input); }}>
            <input autoFocus className="field font-mono" value={input} onChange={(e) => setInput(e.target.value)} />
            <Btn type="submit">Send</Btn>
          </form>
        ) : (
          <Btn className="mt-3 w-full" onClick={start}>Dial *711#</Btn>
        )}
      </div>
    </div>
  );
}
