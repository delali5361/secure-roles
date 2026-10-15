import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge, Btn, Card, Logo } from "@/components/ui-kit";
import { NomineeDetails } from "@/components/Nominee";
import { NomineeDiscussion } from "@/components/NomineeDiscussion";
import { ShareLinks, nomineeUrl } from "@/components/ShareLinks";
import { currentUser, dashFor, fmt, ghs, isPaid, tally, useDB } from "@/lib/store";

export const Route = createFileRoute("/vote/$candidacyId")({
  head: () => ({
    meta: [
      { title: "Vote for a nominee — Ballotglass" },
      { name: "description", content: "Meet the nominee and cast your vote on Ballotglass." },
      { property: "og:title", content: "Vote for a nominee — Ballotglass" },
      { property: "og:description", content: "Meet the nominee and cast your vote on Ballotglass." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NomineeSharePage,
});

function NomineeSharePage() {
  const { candidacyId } = Route.useParams();
  const d = useDB();
  const nav = useNavigate();

  if (!d) return <div className="grid min-h-screen place-items-center bg-stage text-muted-foreground">Loading…</div>;

  const c = d.candidacies.find((x) => x.id === candidacyId && x.status === "approved");
  const e = c && d.elections.find((x) => x.id === c.electionId);
  const p = e?.positions.find((x) => x.id === c.positionId);
  const u = c && d.users.find((x) => x.id === c.userId);
  const me = currentUser(d);

  if (!c || !e || !p || !u) {
    return (
      <div className="grid min-h-screen place-items-center bg-stage p-6">
        <Card className="max-w-md text-center">
          <p className="text-lg font-semibold">Nominee not found</p>
          <p className="mt-1 text-[13px] text-muted-foreground">This link may be old, or the nominee is no longer on the ballot.</p>
          <Link to="/" className="mt-4 inline-block text-[13px] font-medium text-cyan hover:underline">Go to Ballotglass home</Link>
        </Card>
      </div>
    );
  }

  const open = e.status === "open" && new Date(e.endsAt).getTime() > Date.now();
  const paid = isPaid(p);
  const myVotes = me ? (d.payments ?? []).filter((x) => x.candidacyId === c.id && x.voterId === me.id).reduce((s, x) => s + x.quantity, 0) : 0;
  const totalVotes = tally(d, e).find((t) => t.position.id === p.id)?.rows.find((r) => r.c.id === c.id)?.count ?? 0;
  const supporters = (d.reactions ?? []).filter((r) => r.candidacyId === c.id).length;
  const shareText = `Vote for ${c.profile?.stageName ?? u.name} — ${p.title}, ${e.title} on Ballotglass`;

  const voteCta = () => {
    if (!me) nav({ to: "/auth" });
    else nav({ to: dashFor(me.role) });
  };

  return (
    <div className="min-h-screen bg-stage">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between">
          <Logo />
          {me ? (
            <Btn size="sm" variant="ghost" onClick={() => nav({ to: dashFor(me.role) })}>My dashboard</Btn>
          ) : (
            <Link to="/auth"><Btn size="sm">Sign in</Btn></Link>
          )}
        </header>

        <main className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={e.status} />
              <span className="text-[12px] text-muted-foreground">{e.title} · {p.title}</span>
            </div>
            <div className="mt-4"><NomineeDetails c={c} u={u} /></div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-muted-foreground">
              <span><span className="font-semibold text-foreground">{totalVotes}</span> vote{totalVotes === 1 ? "" : "s"}</span>
              <span><span className="font-semibold text-foreground">{supporters}</span> supporter{supporters === 1 ? "" : "s"}</span>
              <span>Voting {open ? <>closes <span className="text-foreground">{fmt(e.endsAt)}</span></> : "is closed"}</span>
              {paid && <span className="text-amber">Paid category · {ghs(p.price ?? 0)} per vote</span>}
            </div>
            {myVotes > 0 && <p className="mt-3 text-[13px] text-mint">You've bought {myVotes} vote{myVotes === 1 ? "" : "s"} for this nominee.</p>}

            {open ? (
              <div className="mt-6 rounded-xl border border-brand/30 bg-brand/10 p-4">
                <p className="font-semibold">{me?.role === "voter" ? "Ready to vote?" : "Sign in as a voter to vote"}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {paid ? "Buy votes for this nominee — every vote counts." : "Cast your free ballot — it takes less than a minute."}
                  {!me && " Create a free voter account to take part."}
                </p>
                <Btn className="mt-3" onClick={voteCta}>{me?.role === "voter" ? (paid ? "Buy votes →" : "Cast my ballot →") : "Sign in to vote →"}</Btn>
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-border bg-card p-4 text-[13px] text-muted-foreground">Voting for this election {e.status === "published" ? "has ended — results are published" : "is not open right now"}.</p>
            )}
          </Card>

          <Card>
            <p className="label-cap">Spread the word</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Share this page so friends can vote too.</p>
            <div className="mt-3"><ShareLinks url={nomineeUrl(c.id)} text={shareText} size="md" /></div>
          </Card>

          <Card>
            <NomineeDiscussion d={d} candidacyId={c.id} />
          </Card>
        </main>
      </div>
    </div>
  );
}
