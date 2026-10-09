import { useState } from "react";
import { Heart, Trash2, Send } from "lucide-react";
import { Btn } from "@/components/ui-kit";
import { actions, currentUser, fmt, type DB } from "@/lib/store";

export function NomineeDiscussion({ d, candidacyId }: { d: DB; candidacyId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const me = currentUser(d);
  const reactions = (d.reactions ?? []).filter((r) => r.candidacyId === candidacyId);
  const supported = reactions.some((r) => r.userId === me?.id);
  const comments = (d.comments ?? []).filter((c) => c.candidacyId === candidacyId);
  return <section className="mt-4 space-y-3 border-t border-border pt-4">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Community</h3><Btn variant={supported ? "soft" : "ghost"} size="sm" aria-pressed={supported} onClick={() => actions.toggleReaction(candidacyId)}><Heart size={14} className={supported ? "fill-mint text-mint" : ""} /> {reactions.length} supporters</Btn></div>
    {comments.map((c) => <div key={c.id} className="border-b border-border pb-2"><div className="flex items-center justify-between"><p className="text-xs font-medium">{d.users.find((u) => u.id === c.userId)?.name ?? "Former member"}</p>{(c.userId === me?.id || me?.role === "admin") && <Btn variant="ghost" size="sm" aria-label="Delete comment" title="Delete comment" onClick={() => actions.deleteComment(c.id)}><Trash2 size={12} /></Btn>}</div><p className="break-words text-sm">{c.body}</p><p className="mt-1 text-[11px] text-muted-foreground">{fmt(c.createdAt)}</p></div>)}
    {!comments.length && <p className="text-xs text-muted-foreground">No comments yet.</p>}
    <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); try { actions.addComment(candidacyId, body); setBody(""); setError(""); } catch (e) { setError((e as Error).message); } }}><input className="field min-w-0" aria-label="Comment" placeholder="Leave a comment…" maxLength={500} value={body} onChange={(e) => setBody(e.target.value)} /><Btn type="submit" disabled={!body.trim()} aria-label="Post comment" title="Post comment"><Send size={15} /></Btn></form>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </section>;
}